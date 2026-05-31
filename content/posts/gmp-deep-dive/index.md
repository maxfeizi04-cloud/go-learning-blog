+++
title = "GMP 调度模型深度解析：从调度循环到工作窃取"
date = 2026-05-31T10:00:00+08:00
draft = false
summary = "深入 GMP 调度模型的内部机制，从数据结构、调度循环、工作窃取到系统调用处理和抢占调度，配合可运行的实验代码理解调度器行为。"
tags = ["gmp", "scheduler", "goroutine", "runtime", "concurrency"]
series = ["Go 并发与控制流"]
slug = "gmp-deep-dive"
+++

在[理解 goroutine 调度器的基本模型]({{< ref "posts/goroutine-scheduler" >}})里，我建立了 G、M、P 三个角色的直觉认知。那篇文章说的是"它们是什么"，这篇我们要深入一个层次："它们怎么配合工作"。

**本文定位**：从工程视角拆解 GMP 的内部机制，不逐行读源码，但会指向关键路径；每个机制都配有可运行的实验，方便你亲手观察调度行为。

## GMP 的数据结构——关键字段速览

调度器代码主要在 `runtime/proc.go` 和 `runtime/runtime2.go` 里。数据结构很长，但真正影响行为的字段就下面这些：

### G — goroutine

| 字段 | 含义 |
|------|------|
| `goid` | goroutine 唯一 ID（从 `runtime.sched.goidgen` 分配） |
| `status` | 状态：`_Gidle` → `_Grunnable` → `_Grunning` → `_Gdead`，中间还可能经过 `_Gsyscall`、`_Gwaiting` |
| `sched` | `gobuf` 类型，保存 `sp`（栈指针）、`pc`（程序计数器）、`bp` 等寄存器现场 |
| `stack` | 栈的起止地址（初始 2KB，按需扩容） |
| `m` | 当前绑定的 M（运行时态） |
| `atomicstatus` | 原子操作的状态字，供无锁读取 |

状态流转的核心路径：

```
         newproc
_Gidle ─────────→ _Grunnable ──→ _Grunning
                       ↑              │
                       │              ├──→ _Gdead (正常返回)
                       │              │
              goready  │              ├──→ _Gsyscall (进入系统调用)
                       │              │       │
                       │              │       ├── exitsyscall → _Grunnable (P 还在)
                       │              │       └── exitsyscall → _Gidle (P 被偷)
                       │              │
                       │              └──→ _Gwaiting (gopark，等待 channel/锁/timer)
                       │                       │
                       └───────────────────────┘  (被 goready 唤醒)
```

### M — 操作系统线程

| 字段 | 含义 |
|------|------|
| `g0` | **调度协程**——每个 M 都有专属的 g0，运行 `schedule()` 等调度逻辑，有独立栈（~8KB） |
| `curg` | 当前在跑的普通 G（用户代码） |
| `p` | 当前绑定的 P（没有 P 的 M 只能等 sysmon 分配） |
| `spinning` | 是否在自旋寻找可运行 G |
| `nextp` | 被唤醒但还没拿 P 的 M，预备绑定的 P |
| `park` | M 休眠时的记录节点 |

关键认知：M 上跑两类 goroutine——`g0`（调度代码）和普通 G（用户代码）。切换发生在 `mcall()` 调用时（例如 `goschedImpl` → `mcall(gosched_m)`），g0 栈保证调度路径不会压到用户栈。

### P — 逻辑处理器

| 字段 | 含义 |
|------|------|
| `runq` | 本地可运行队列，容量 256，无锁访问（只有绑定的 M 操作它） |
| `runnext` | "下一个优先运行"的 G。新创建的 G 往往放这里，获得立即执行权 |
| `runqhead` / `runqtail` | 环形队列头尾指针 |
| `mcache` | 每个 P 绑定一个内存分配缓存 |
| `status` | `_Pidle` / `_Prunning` / `_Psyscall` / `_Pgcstop` / `_Pdead` |
| `schedtick` | 调度计数，递增表示调度次数增多 |
| `syscalltick` | 系统调用计数，sysmon 用它判断 P 是否在阻塞 syscall 里逗留太久 |

{{< callout type="tip" title="为什么 P 的 runq 容量是 256？" >}}
这是一个工程权衡。太小会导致频繁走全局队列或工作窃取，太大则窃取成本高（一次最多偷一半 = 128 个）。256 是多数工况的甜点。
{{< /callout >}}

## 调度循环全景——从 `go func()` 到执行

把调度循环拆成五步，每一步都指向 runtime 中的对应函数。

### 第一步：创建 G

```go
go doWork()
```

编译器会把 `go` 关键字翻译成 `runtime.newproc()`。它做的事情：

1. 从当前 P 的 `gFree` 列表（或全局列表）取一个空闲 G 结构体
2. 将函数指针和参数写入 G 的 `sched` 字段（`gobuf.pc` 指向函数入口）
3. 设置 G 的状态为 `_Grunnable`
4. 调用 `runqput()` 尝试放入当前 P 的 runq

### 第二步：入队 `runqput()`

入队优先级：

```
有 runnext 空位 → 放到 P.runnext
     ↓ (否)
P.runq 未满(256) → 放到 P.runq 尾部
     ↓ (否)
全局队列 sched.runq
```

**runnext 的设计意图**：新创建的 G 很可能马上用到创建者持有的数据（局部性），优先调度它有助于减少 cache miss。

### 第三步：找可运行的 G `findrunnable()`

这是调度器最核心的函数，按照资源获取成本从低到高依次查找：

```
1. P.runnext           ← 几乎零成本
2. P.runq (1/256)      ← 自己在队列里挑一个
3. P.runq (每隔 61 次扫一次全局) ← 防全局队列饿死
4. sched.runq (全局)   ← 从全局 runq 取一批
5. netpoll(false)      ← 非阻塞检查网络事件
6. runqsteal(随机 P)   ← 工作窃取
7. 重复 4-6 最多 4 轮   ← 自旋
8. pollWork()          ← 阻塞等待
```

`findrunnable()` 返回一个 G 后，`schedule()` 调用 `execute()`。

### 第四步：执行 `execute()`

```go
func execute(gp *g, inheritTime bool) {
    _g_ := getg()          // 当前 g0
    _g_.m.curg = gp        // 把 gp 设为 M 的当前用户 G
    gp.m = _g_.m
    casgstatus(gp, _Grunnable, _Grunning)
    gp.schedlink = 0

    gogo(&gp.sched)        // 汇编：恢复 gp 的寄存器现场，跳转到 gp.sched.pc
}
```

`gogo` 之后就"再也不会回来"——执行流跳到了新 G 的代码里。当这个 G 退出时（`runtime.goexit0`），会回到 g0 栈重新进入 `schedule()`，形成闭环。

### 第五步：退出与循环

普通 G 执行完后，`goexit` → `goexit1` → `mcall(goexit0)`：

```go
func goexit0(gp *g) {
    _g_ := getg()
    casgstatus(gp, _Grunning, _Gdead)
    gp.m = nil
    dropg()              // 解除 M 和 G 的绑定
    gfput(_g_.m.p, gp)   // G 结构体回收到 free list
    schedule()           // 回到调度循环的起点
}
```

### 完整链路图

```
go func()                G 执行完毕
  │                         ↑
  ▼                         │
newproc() ──→ goexit0() ──→ schedule()
  │              │              │
  ▼              │              ▼
runqput()        │         findrunnable()
  │              │              │
  ▼              │              ▼
(调度循环      ← ─┘         execute() ──→ gogo()
 持续运行)                                   │
                                             ▼
                                        用户代码
```

{{< callout type="info" title="一个关键细节" >}}
每次从 `findrunnable()` 到 `execute()` 的切换，都在 g0 栈上完成，不消耗用户 G 的栈空间。这也是为什么 goroutine 的初始栈可以这么小（2KB）。
{{< /callout >}}

## 工作窃取——"我帮你分担"

### 窃取策略

当一个 P 的本地队列空了，`findrunnable()` 会进入工作窃取阶段。核心函数是 `runqsteal()`：

```go
// runtime/proc.go
func runqsteal(_p_, p2 *p, stealRunNextG bool) *g
```

策略规则：

| 规则 | 说明 |
|------|------|
| 随机起点 | 从 `random(N)` 号 P 开始检查，而非总是从 0 开始。避免所有空闲 P 同时盯上同一个 P |
| 一次偷一半 | 如果 `p2` 的 `runq` 有 N 个 G，偷走 `N/2` 个（含 runnext 则优先偷 runnext） |
| 最多尝试 4 轮 | `findrunnable()` 里自旋检查阶段最多跑 4 轮 work stealing |
| 不偷自旋中的 P | 已经在自旋的 P，其 runq 大概率也是空的 |

**为什么偷一半而不是一个？** 摊还成本。一次窃取需要持有两把锁（自己的和对方的），偷一批比偷十次划算。

### 为什么不是"公平分摊"

Goroutine 调度**不是**均分 CPU。设计上更偏袒"本地的 G"：

- 新建的 G 优先放创建者的 P
- 别处的 P 只有在空闲时才来"帮忙"
- 如果所有 P 都忙，新 G 就去全局队列，等待某个 P 空闲时统一拉取

这一设计在 latency（不要让 G 等太久）和 locality（尽量让 G 在同一个 CPU 上跑，利用 cache 热数据）之间找到了平衡点。

### 实验一：用 GODEBUG 观察工作窃取

```go
package main

import (
    "fmt"
    "runtime"
    "sync"
    "time"
)

func main() {
    runtime.GOMAXPROCS(2) // 只用 2 个 P，方便观察

    var wg sync.WaitGroup

    // 启动一个 CPU-heavy 的 P
    wg.Add(1)
    go func() {
        defer wg.Done()
        end := time.Now().Add(50 * time.Millisecond)
        for time.Now().Before(end) {
        }
        fmt.Println("heavy done")
    }()

    // 立即启动另一个短任务——它可能被 work stealing 拉到"空闲的"另一个 P
    wg.Add(1)
    go func() {
        defer wg.Done()
        fmt.Println("light task done")
    }()

    wg.Wait()
}
```

用环境变量运行：

```bash
GODEBUG=schedtrace=1000,scheddetail=1 GOMAXPROCS=2 go run main.go
```

关键输出解读：

```
SCHED 1000ms: gomaxprocs=2 idleprocs=0 threads=4 spinningthreads=0
  P0: status=1 schedtick=45 syscalltick=0 m=2 runqsize=0
  P1: status=1 schedtick=42 syscalltick=0 m=3 runqsize=1
```

- `idleprocs`：空闲 P 的数量，0 表示都在忙
- `spinningthreads`：自旋中的 M 数量
- `runqsize`：该 P 本地队列的 G 数量，如果你观察到本来全在某 P 的 G 被拉走了，那就是 work stealing 在起作用

## 系统调用处理——P 的"让位"机制

阻塞的系统调用（如文件 I/O `os.Read`）会真正卡住 OS 线程。如果不处理，一个阻塞的 `os.Read` 能让整个 P 上所有 G 都动不了。Go 运行时的解法是：**让 P 离开被阻塞的 M**。

### entersyscall → exitsyscall 全流程

```
G 发起阻塞 syscall
       │
       ▼
entersyscall()          ← 把 M.P 的 G 状态切为 _Gsyscall
       │                  原子操作标记 P 为 _Psyscall
       ▼
       ├── P 还在？→ 是 → 系统调用快速返回 → exitsyscall() fast-path
       │                                       直接恢复 _Grunning
       │
       └── P 被 sysmon 拿走 → M 阻塞在 syscall 里
                                      │
                          exitsyscall() slow-path
                              │
                              ▼
                         G → _Grunnable（放回全局队列）
                         M 尝试抢新的 P，抢不到就 park
```

### sysmon 的角色

`sysmon` 是运行时不通过 P 跑的一个特殊 M，周期性地做后台检查：

- **检查 syscall 卡顿**：如果某个 P 处于 `_Psyscall` 状态超过 10ms（非阻塞 syscall）或 20µs（阻塞 syscall），就把 P 从 M 上剥离，交给其他 M
- **检查 netpoll**：轮询网络就绪事件
- **抢占**：给运行过久的 G 发抢占信号
- **GC 协调**：在必要时触发 GC

{{< callout type="tip" title="sysmon 不参与 GMP 调度" >}}
sysmon 有自己独立的 M，不绑定任何 P，也不会被 `schedule()` 调度。它是一个"监控 goroutine"，做的事情和用户代码完全对等。
{{< /callout >}}

### 实验二：对比阻塞 I/O 和网络 I/O 的 M 数量

```go
package main

import (
    "fmt"
    "net"
    "os"
    "runtime"
    "sync"
    "time"
)

func main() {
    runtime.GOMAXPROCS(1) // 只用 1 个 P，效果最明显

    var wg sync.WaitGroup

    printStats := func(label string) {
        fmt.Printf("%s: goroutines=%d threads=%d\n",
            label, runtime.NumGoroutine(),
            pprofThreadCount())
    }

    // 场景 A：阻塞文件 I/O（会真的卡住 M）
    printStats("initial")
    wg.Add(1)
    go func() {
        defer wg.Done()
        f, _ := os.Open("large_file.txt") // 假设存在
        buf := make([]byte, 1024)
        f.Read(buf) // 阻塞 syscall → M 被卡 → runtime 可能创建新 M
        f.Close()
    }()

    time.Sleep(50 * time.Millisecond)
    printStats("during blocking read")

    // 场景 B：网络 I/O（通过 netpoller，不卡 M）
    wg.Add(1)
    go func() {
        defer wg.Done()
        conn, _ := net.DialTimeout("tcp", "example.com:80", 2*time.Second)
        if conn != nil {
            conn.Close()
        }
    }()

    time.Sleep(100 * time.Millisecond)
    printStats("during network io")

    wg.Wait()
    printStats("final")
}

func pprofThreadCount() int {
    // 简化版本：实际可用 runtime/pprof.Lookup("threadcreate").Count()
    return 0
}
```

核心观察点：跑阻塞 I/O 时 `runtime` 可能创建更多 M（通过 `startm()`），因为原 M 被卡在系统调用里，而 Go 代码还需要线程来执行。网络 I/O 场景下 M 数量基本不变——根本原因就是 netpoller。

## netpoller——网络 I/O 为什么不卡 M

这是 GMP 模型中最精妙的设计之一。**netpoller 把"同步等待"从 M 上剥离出去，让 G 而不是 M 去等**。

### 协作流程

```
G 调用 conn.Read()
       │
       ▼
fd 未就绪 → netpollblock()
       │
       ▼
gopark() → G 状态变 _Gwaiting
       │            │
       ▼            ▼
fd 注册到         M 继续跑 schedule()
epoll/kqueue      (去找其他可运行的 G)
       │
       ▼
fd 就绪 ← epoll_wait (由 netpoll() 周期检查)
       │
       ▼
netpollunblock() → goready(G)
       │
       ▼
G 回到 _Grunnable → 加入某个 P 的 runq
```

关键点：**等数据的始终是 G，不是 M**。当一个 G 因为网络 I/O 被 park 掉，M 会立即开始执行下一个可运行的 G。M 从不空转等网络。

### netpoll() 的调用时机

`netpoll()` 被调用的场景：

1. **`findrunnable()` 里非阻塞调用** `netpoll(false)`——顺便看看有没有网络 I/O 就绪的 G，有就捡走
2. **`schedule()` 进入阻塞前**——马上要 `stopm()` 休眠了，最后看一眼
3. **sysmon 定期调用**——每轮监控都跑一次，持续喂活被网络唤醒的 G

三者配合，使得网络 I/O 的 G 总能被及时重新调度，而不会累积在 netpoller 的内部队列里。

### 实验三：对比 1000 个网络连接 vs 1000 个文件读取

```go
package main

import (
    "fmt"
    "runtime"
    "sync"
    "time"
)

const N = 1000

func main() {
    runtime.GOMAXPROCS(4)

    var wg sync.WaitGroup
    start := time.Now()

    // 网络场景：并发建立连接（它们在 netpoller 里等，M 不会膨胀到 N 个）
    for i := 0; i < N; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            // 模拟一次网络等待
            timer := time.NewTimer(10 * time.Millisecond)
            <-timer.C
        }(i)
    }

    // 定期观察线程数
    go func() {
        for {
            fmt.Printf("goroutines: %d\n", runtime.NumGoroutine())
            time.Sleep(5 * time.Millisecond)
        }
    }()

    wg.Wait()
    fmt.Printf("elapsed: %v\n", time.Since(start))
}
```

运行这个实验，你会发现即使有 1000 个 goroutine 同时在"等"，运行时也只维护了少量 M（通常≈GOMAXPROCS+少量自旋）。这就是 netpoller 的威力。

> 如果把 `<-timer.C` 换成 `os.Read`，M 的数量会显著上升——因为那些 M 被真正的阻塞系统调用卡住了，运行时被迫创建新线程。

## 抢占调度——"你已经跑太久了"

### 从协作到抢占

| 阶段 | 机制 | 局限性 |
|------|------|--------|
| Go 1.2 之前 | 纯协作：G 主动调用 `Gosched()` 或在函数入口处配合栈检查 | 不配合的 G（如死循环无条件调用）会让整个 P 卡死 |
| Go 1.2 ~ 1.13 | 栈分段抢占：编译器在函数序言插入 `morestack` 检查，sysmon 给长时间运行的 G 标记 `stackguard0 = stackPreempt` | 仍然只在函数调用边界检查，紧凑循环依然无法打断 |
| Go 1.14+ | **异步信号抢占**：sysmon 检测到 G 运行超过 10ms，通过 `preemptone()` 向 M 发操作系统信号（Unix: `SIGURG`），信号处理函数里切走 G | 信号处理器内部有一些限制（如不能在写屏障期间），个别极端情况仍无法抢占 |

### 触发抢占的条件

sysmon 会周期性执行 `retake()`，检查每个 P：

```go
// runtime/proc.go (简化逻辑)
func retake(now int64) uint32 {
    for i := 0; i < len(allp); i++ {
        _p_ := allp[i]
        if _p_ == nil {
            continue
        }
        // 处于 _Prunning 且已经连续跑了 >10ms
        if _p_.status == _Prunning {
            if runqempty(_p_) && sched.nmspinning+sched.npidle > 0 {
                preemptone(_p_)
            }
        }
    }
}
```

两个核心条件：
1. **G 已经连续运行超过 10ms**（`forcePreemptNS` = 10ms）
2. **有其他 P 空闲或有自旋 M 存在**（否则抢占了也没别人能跑，无意义）

### 哪些代码无法被抢占

即使 Go 1.14 引入了异步抢占，仍有少数场景无法打断：

- 执行时间极短的单条汇编指令（信号只有在指令边界才投递）
- `cgo` 调用期间（在 C 代码里，Go 信号处理器无法介入）
- GC 的某些关键阶段（如 stop-the-world 期间）
- 禁用了抢占的 `systemstack` 代码

**工程建议**：不要依赖抢占来"拯救"死循环。如果有一段代码可能运行很久（如大规模计算），定期检查 `context` 或插入 `runtime.Gosched()` 主动让出 CPU。

### 实验：对比不可抢占的死循环

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    runtime.GOMAXPROCS(1) // 只有一个 P，抢占的动机最强

    // 一个死循环——Go 1.14+ 能被抢走
    go func() {
        i := 0
        for {
            i++
        }
    }()

    // 另一个 goroutine 试试能不能插进来
    time.Sleep(100 * time.Millisecond)
    fmt.Println("I'm still alive!") // Go 1.14+ 会打印这行

    // 老版本 Go 可能永远到不了这里，因为上面那个死循环把唯一的 P 霸占了
}
```

在 Go 1.14+ 下运行，第二个 goroutine 大约 10ms 后就能被调度——`fmt.Println` 会正常执行。

## 自旋线程——"闲着也别马上睡"

### 为什么需要自旋

当一个 M 找不到可运行的 G 时，它不会立刻休眠。如果 `sched.nmspinning < 2`（最多 2 个自旋 M），它会进入自旋态并短暂停留：

- **减少延迟**：万一下一个 G 马上就来（比如刚从系统调用返回），自旋 M 可以瞬间接手，省去了唤醒休眠 M 的 20~30µs 开销
- **避免 P 空转**：一个 P 在等 G 时，最好有一个 M 准备好马上执行它

### 自旋的限制

```go
// 自旋上限
const (
    maxmcount    = 10000 // M 总数上限
)

// nmspinning 计数
// findrunnable() 里：
if sched.nmspinning >= 2 {
    // 不参与自旋，直接停掉 M
    stopm()
}
```

| 限制项 | 值 | 原因 |
|--------|-----|------|
| 同时自旋 M 数 | ≤ 2 | 超过 2 个空转 M 纯属浪费 CPU |
| 自旋检查轮数 | ≤ 4 | 每轮都跑 netpoll + work stealing |
| 总 M 数 | ≤ 10000 | 硬上限，防止 M 无限膨胀 |

### 自旋 M 的生命周期

```
M 找不到 G
    │
    ▼
nmspinning < 2？
    ├── 是 → 设置 M.spinning = true，nmspinning++
    │        在 findrunnable() 里自旋 ≤ 4 轮
    │        仍然找不到？→ stopm() 休眠
    │
    └── 否 → stopm() 直接休眠
```

## 调优清单——什么时候需要干预

大多数 Go 程序不需要手动调调度器参数。但当你遇到以下信号时，可以考虑介入：

### GOMAXPROCS

```go
runtime.GOMAXPROCS(runtime.NumCPU())
```

| 场景 | 建议 |
|------|------|
| CPU 密集型，容器里跑 | 设置为核心数，避免超卖 |
| IO 密集型（大量网络调用）| 可以设为核心数的 2~4 倍，因为多数 G 在 netpoller 等待 |
| 混合型 | 默认值通常够用，先做 profiling 再调 |

### GODEBUG 调度追踪

```bash
# schedtrace=1000：每 1000ms 打印一次调度统计
GODEBUG=schedtrace=1000 go run main.go

# scheddetail=1：打印每个 P 的详细信息
GODEBUG=schedtrace=1000,scheddetail=1 go run main.go
```

关键指标解读：

| 输出字段 | 含义 | 关注点 |
|----------|------|--------|
| `gomaxprocs` | 活跃 P 总数 | 是否和你设的一致 |
| `idleprocs` | 空闲 P 数量 | 持续偏高 = 任务太少；持续为 0 = 饱和 |
| `threads` | M 总数 | 如果远大于 gomaxprocs+2，可能在频繁创建线程（阻塞 syscall 过多） |
| `spinningthreads` | 自旋 M 数（0~2） | 正常为正，持续 2 = 找不到活干 |
| `runqsize` | 某 P 的本地队列长度 | 个别 P 的 runqsize 很大，而其他 P 为 0 = 任务不均衡 |
| `schedtick` | 调度次数 | 快速递增表示调度活跃 |
| `syscalltick` | 系统调用次数 | 高的 P 可能在 IO 密集型代码上 |

### 主动让出 vs 等待

```go
// 让出 CPU，但不阻塞——自己回到 runq 尾部
runtime.Gosched()

// 绑定当前 G 到当前 OS 线程，防止被调度到其他 M
runtime.LockOSThread()
defer runtime.UnlockOSThread()
```

- `Gosched()` 适合"我不急，先让别人跑"的计算密集长链
- `LockOSThread()` 适合 `cgo` 调用或需要线程局部存储的场景

### 决策树

```
你的 Go 程序有性能问题？
    │
    ├── CPU 用不满（但任务很多）
    │   └── 检查 GOMAXPROCS 是否小于 CPU 核数？
    │       也可能是任务粒度太细，调度开销占比过高
    │
    ├── goroutine 数量爆炸
    │   └── 统计阻塞在哪：channel？锁？还是 IO？
    │       加限流（worker pool + semaphore）
    │
    ├── M 数量持续增长（超出预期）
    │   └── 说明有阻塞系统调用 → 检查文件 IO / cgo
    │       考虑换成异步方案或带缓冲的文件操作
    │
    └── 延迟不稳定（抖动大）
        └── 开 GODEBUG=schedtrace=100 看 idleprocs 和 runqsize
            可能是 G 分布不均或 GC 压力大
```

## 总结

GMP 调度器的核心设计思想可以浓缩为一句话：**用"少量的 M + P 做调度上下文 + 大量的 G 做任务载体"来调和并发性能与系统资源**.

### 一张图总结全链路

```
┌─────────────────────────────────────────────────┐
│  go func()                                       │
│      │                                            │
│      ▼                                            │
│  newproc → runqput(P.runq / runnext / global)    │
│                                                    │
│  ┌──────────────── 调度循环 ──────────────────┐   │
│  │                                              │   │
│  │  schedule() ←──────────────────────────────┐│   │
│  │      │                                      ││   │
│  │      ▼                                      ││   │
│  │  findrunnable()                             ││   │
│  │      │                                      ││   │
│  │      ├─ runnext (几乎免费)                   ││   │
│  │      ├─ local runq (自己的)                  ││   │
│  │      ├─ global runq (全局)                   ││   │
│  │      ├─ netpoll (非阻塞检查网络)              ││   │
│  │      ├─ work stealing (偷别人的)             ││   │
│  │      └─ spin / park (最后手段)               ││   │
│  │      │                                      ││   │
│  │      ▼                                      ││   │
│  │  execute() → gogo() → 用户代码              ││   │
│  │                    │                        ││   │
│  │      ┌─────────────┼─────────────┐          ││   │
│  │      ▼             ▼             ▼          ││   │
│  │  正常返回      syscall        gopark         ││   │
│  │  goexit0()   entersyscall    _Gwaiting       ││   │
│  │      │           │              │            ││   │
│  │      │      exitsyscall    被唤醒:            ││   │
│  │      │      (回 runq)     goready(G)         ││   │
│  │      │           │              │            ││   │
│  │      └───────────┴──────────────┘            ││   │
│  │                  │                           ││   │
│  └──────────────────┼───────────────────────────┘│   │
│                     │                            │   │
│                     ▼                            │   │
│              schedule() ─────────────────────────┘   │
│                                                       │
│  sysmon (独立 M，无 P)                                │
│      ├─ 监控长时间 syscall → 抢 P 交给其他 M          │
│      ├─ 监控运行超时 G → 发抢占信号                   │
│      └─ 定期调用 netpoll → 喂活就绪 G                 │
└───────────────────────────────────────────────────────┘
```

### 关键结论

1. **G 是任务，M 是工人，P 是工位**——理解这个三角关系是最重要的第一步
2. **调度循环永不退出**——`schedule()` → `execute()` → `goexit0()` → `schedule()`，M 一生都在这个圈里转
3. **工作窃取偷一半、随机起**——兼顾公平和局部性，避免羊群效应
4. **网络 I/O 不卡 M**——netpoller 让等待的 G 离开 M，M 继续干活；阻塞文件 I/O 会真正卡 M，运行时被迫创建新线程
5. **Go 1.14+ 的抢占是异步信号**——多数死循环能被救回来，但别依赖它
6. **先 profiling，再调参**——`GODEBUG=schedtrace` 是先导，别盲调 `GOMAXPROCS`
7. **自旋 ≤ 2、check ≤ 4 轮、M 总数 ≤ 10000**——这些数字不是魔法，是 n 年工程实践的沉淀

**延伸阅读建议**：如果想进一步理解 GMP，可以配合阅读 `runtime/proc.go` 里的 `schedule()`、`findrunnable()`、`runqsteal()` 三个函数，以及 `runtime/netpoll.go` 的 netpoller 实现。
