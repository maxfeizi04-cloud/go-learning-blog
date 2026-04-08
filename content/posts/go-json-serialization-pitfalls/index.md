+++
title = "Go + JSON 序列化的经典坑与修复思路"
date = 2026-04-07T10:00:00+08:00
draft = true
summary = "整理 Go 项目里最常见的 JSON 序列化坑：omitempty 的误解、数值精度丢失、time.Time 格式化、未知字段吞掉等，并给出可落地的修复方式。"
tags = ["json", "encoding-json", "serialization", "errors"]
series = ["Go 工程化实践"]
slug = "go-json-serialization-pitfalls"
+++

Go 的 `encoding/json` 足够好用，但它的“默认行为”里藏了不少隐蔽坑。下面按出现频率整理一份“经典坑 + 修复”，让你在面试和线上问题里都能快速定位。

## 核心结论

`encoding/json` 的默认行为是“尽量成功地解码/编码”。这意味着：

- 字段名对不上时不会报错
- 未导出的字段直接被忽略
- 数值会被解析成 `float64`
- `omitempty` 只看“空值”，不是“业务上无意义”

> 规则：一旦进入生产，建议显式配置 `Decoder`，并为关键结构体定制序列化行为。

## 经典坑与修复

### 1. `omitempty` 和零值语义不一致

`omitempty` 只认零值：`0`、`""`、`false`、`nil`、空切片或空 map。它不懂业务含义。

```go
type Order struct {
	Discount int `json:"discount,omitempty"`
}
```

如果你需要“0 也要输出”，就不能用 `omitempty`，或者使用指针区分“未设置”与“设置为 0”：

```go
type Order struct {
	Discount *int `json:"discount,omitempty"`
}
```

### 2. `time.Time` 的零值不会被 `omitempty` 过滤

`time.Time{}` 不是零值指针，所以 `omitempty` 不会生效。

```go
type User struct {
	LastLogin time.Time `json:"last_login,omitempty"`
}
```

修复方式：

- 用 `*time.Time`
- 或自定义类型实现 `IsZero()`（Go 1.13+ 的 `encoding/json` 会识别）

```go
type User struct {
	LastLogin *time.Time `json:"last_login,omitempty"`
}
```

### 3. `int64` 被前端当成 `float64` 精度丢失

JSON 没有整数类型，JS 会把大整数当成 `number`，超出安全范围就丢精度。

修复方式：

- 用字符串传输：`json:",string"`
- 或后端输出字符串字段

```go
type Account struct {
	ID int64 `json:"id,string"`
}
```

### 4. `interface{}` 解码成 `float64`

默认反序列化会把所有数字解析成 `float64`。

```go
var v map[string]interface{}
_ = json.Unmarshal(data, &v)
// v["count"] 是 float64
```

修复方式：

```go
dec := json.NewDecoder(bytes.NewReader(data))
dec.UseNumber()
if err := dec.Decode(&v); err != nil {
	return err
}
```

### 5. 未导出字段不会被编码

`encoding/json` 只处理导出字段，小写字段会被直接忽略。

```go
type User struct {
	id   int    // 不会被序列化
	Name string `json:"name"`
}
```

修复方式：字段首字母大写，或加显式映射结构体。

### 6. 字段名不匹配不报错

默认情况下多余字段会被吞掉，拼错字段名也不报错。

修复方式：开启严格模式。

```go
dec := json.NewDecoder(r)
dec.DisallowUnknownFields()
if err := dec.Decode(&dst); err != nil {
	return err
}
```

### 7. `json.RawMessage` 被误用导致双重转义

`RawMessage` 是“原始 JSON 片段”，不要先 `Marshal` 再包一次。

```go
type Wrapper struct {
	Body json.RawMessage `json:"body"`
}
```

如果你把 `Body` 写成 `[]byte` 且内容是 JSON 字符串，会被二次转义。

### 8. 自定义 `MarshalJSON` 容易递归爆栈

最常见的坑是直接在 `MarshalJSON` 里对自身再次 `json.Marshal`。

修复方式：定义别名类型。

```go
type User struct {
	Name string `json:"name"`
}

func (u User) MarshalJSON() ([]byte, error) {
	type Alias User
	return json.Marshal(Alias(u))
}
```

### 9. `nil` 和空切片的输出差异

`nil` 切片输出是 `null`，空切片输出 `[]`，很多 API 会要求统一。

修复方式：初始化成空切片。

```go
if users == nil {
	users = []User{}
}
```

### 10. HTML 默认转义导致数据不一致

`Encoder` 默认会转义 `<`, `>`, `&`，会影响签名或前端显示。

修复方式：

```go
enc := json.NewEncoder(w)
enc.SetEscapeHTML(false)
if err := enc.Encode(v); err != nil {
	return err
}
```

## 面向生产的推荐配置

如果是 API 解码，建议统一封装：

```go
func decodeJSON(r io.Reader, dst any) error {
	dec := json.NewDecoder(r)
	dec.DisallowUnknownFields()
	dec.UseNumber()
	return dec.Decode(dst)
}
```

编码侧建议统一设置 `SetEscapeHTML(false)`，并在关键结构体上明确是否允许 `omitempty`。

## 我的总结

JSON 的坑几乎都来自“默认行为”。一旦业务变复杂，明确的编码规则比“省几行代码”更重要。我的做法是：生产场景优先显式 `Decoder` 配置，关键结构体用指针表达“是否设置”，并在评审里把 JSON 作为 API 合约去对待。

