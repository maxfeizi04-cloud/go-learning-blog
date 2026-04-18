+++
title = "gRPC 环境搭建详解：Windows、macOS、Linux 全流程"
date = 2026-04-18T10:30:00+08:00
draft = false
summary = "从 Go、protoc、Go 插件到 PATH 和版本校验，系统梳理 gRPC 在 Windows、macOS、Linux 上的完整环境搭建流程。"
tags = ["grpc", "protobuf", "rpc", "tooling"]
series = ["Go Web 与接口设计"]
slug = "grpc-environment-setup"
+++

很多人第一次接触 gRPC，真正卡住的地方往往不是服务定义，而是环境：

- `protoc` 没装
- Go 插件没装
- PATH 没配
- 能生成 protobuf，不能生成 gRPC 代码
- Windows、macOS、Linux 的安装命令又不一样

这篇文章不讲 gRPC 原理，只聚焦一件事：把开发环境一次搭到可用。

## 背景

在 Go 里做 gRPC 开发，最基础的链路通常是：

1. 安装 Go
2. 安装 `protoc`
3. 安装 Go 的 protobuf 插件
4. 安装 Go 的 gRPC 插件
5. 用 `.proto` 文件生成 Go 代码

如果这条链路里任何一个环节没配好，后面的命令都会报错。

## 你最终要具备的东西

从结果看，环境搭好以后，至少要满足这几件事：

- `go version` 能正常输出
- `protoc --version` 能正常输出
- `protoc-gen-go` 能被系统找到
- `protoc-gen-go-grpc` 能被系统找到

如果这四项都通了，gRPC 的基础开发环境基本就齐了。

## 第一步：安装 Go

### Windows

最直接的方式是：

1. 打开 Go 官方下载页
2. 下载 Windows 安装包
3. 执行安装

安装完成后，在 PowerShell 里验证：

```powershell
go version
```

### macOS

可以直接安装官方 `.pkg`，也可以用包管理器。

如果你用 Homebrew：

```bash
brew install go
```

安装后验证：

```bash
go version
```

### Linux

Linux 常见有两种做法：

- 用发行版包管理器
- 直接下载官方 tarball

例如 Ubuntu：

```bash
sudo apt update
sudo apt install golang-go
```

安装后验证：

```bash
go version
```

## 第二步：安装 protoc

gRPC 的代码生成依赖 Protocol Buffers 编译器，也就是 `protoc`。

### Windows

常见做法：

1. 下载 `protoc` 的 Windows 压缩包
2. 解压后把 `bin` 目录加入系统 PATH

验证命令：

```powershell
protoc --version
```

### macOS

如果你用 Homebrew：

```bash
brew install protobuf
```

验证：

```bash
protoc --version
```

### Linux

Ubuntu 常见命令：

```bash
sudo apt update
sudo apt install protobuf-compiler
```

验证：

```bash
protoc --version
```

## 第三步：安装 Go 代码生成插件

Go 里最少要装两个插件：

- `protoc-gen-go`
- `protoc-gen-go-grpc`

安装命令：

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

这两条命令会把可执行文件装到 Go 的 `bin` 目录里。

## 第四步：确认 Go bin 在 PATH 里

这是最容易漏掉的一步。

如果你已经执行了 `go install`，但 `protoc` 还是提示找不到插件，通常就是 PATH 没配好。

### 先确认 Go bin 在哪

```bash
go env GOPATH
```

通常插件会在：

```text
$GOPATH/bin
```

如果你没有显式设置 GOPATH，Go 默认会用：

- Windows: `%USERPROFILE%\\go\\bin`
- macOS/Linux: `$HOME/go/bin`

### Windows

PowerShell 当前会话临时加 PATH：

```powershell
$env:Path += \";$env:USERPROFILE\\go\\bin\"
```

如果要长期生效，就把它加到系统或用户环境变量里。

### macOS / Linux

把下面这行加进你的 shell 配置文件，例如 `.zshrc`、`.bashrc`：

```bash
export PATH=\"$PATH:$HOME/go/bin\"
```

然后重新加载：

```bash
source ~/.zshrc
```

或者：

```bash
source ~/.bashrc
```

## 第五步：验证插件是否能被找到

你不一定要直接执行插件，但至少可以这样确认：

### Windows

```powershell
Get-Command protoc-gen-go
Get-Command protoc-gen-go-grpc
```

### macOS / Linux

```bash
which protoc-gen-go
which protoc-gen-go-grpc
```

如果查不到，问题基本就是 PATH。

## 第六步：准备一个最小 proto 文件

例如新建 `proto/hello.proto`：

```proto
syntax = "proto3";

package hello;

option go_package = "example.com/grpcdemo/proto;proto";

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

这里最容易漏的是 `option go_package`。如果不写，Go 代码生成时经常会出现包路径问题。

## 第七步：生成 Go 代码

在项目根目录执行：

```bash
protoc \
  --go_out=. \
  --go-grpc_out=. \
  proto/hello.proto
```

如果你在 Windows PowerShell 里，更直接的单行写法可以是：

```powershell
protoc --go_out=. --go-grpc_out=. proto/hello.proto
```

生成成功后，通常会看到：

- `hello.pb.go`
- `hello_grpc.pb.go`

## 最常见的报错与排查

### 1. `protoc: command not found`

说明 `protoc` 本身没装好，或者不在 PATH。

### 2. `protoc-gen-go: program not found or is not executable`

说明插件没装，或者 Go bin 没进 PATH。

### 3. 只生成了 `.pb.go`，没有生成 `_grpc.pb.go`

通常是：

- `protoc-gen-go-grpc` 没装
- 命令里没写 `--go-grpc_out`

### 4. `go_package` 相关错误

通常是 `.proto` 里的 `option go_package` 写得不合适，或者生成目录和模块路径没对齐。

## 一个更稳的建议

如果你后面准备长期写 gRPC 项目，不要只停留在“系统里能跑通命令”。

更稳的做法是把生成命令固化到：

- `Makefile`
- `Taskfile`
- PowerShell 脚本
- npm script / justfile

这样团队协作时不会每个人都手敲一遍命令。

## 我的总结

- Go 做 gRPC 的核心环境就是 `go + protoc + 两个 Go 插件`
- 真正最容易出问题的通常不是安装本身，而是 PATH
- `option go_package` 很重要，别省
- Windows、macOS、Linux 的差异主要集中在安装命令和 PATH 配置
- 环境一旦跑通，最好把生成命令固化成脚本，不要长期手敲
