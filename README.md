## TODO

must

- [ ] isEditing 应该只有 input 框才触发
- [ ] 处理 checked 没有转换

- [ ] 只读模式 readOnly
- [ ] 敲定最外层的 api
- [ ] 全局的 watch
- [ ] 全局的 extend
- [ ] validation 整个的细节实现
- [ ] default/disabled 等 （default 的展示，比如 checkbox 的字段是 defaultChecked）
- [ ] 对使用 ui:options 继续兼容
- [ ] form 的方法全部补齐

- [ ] validationTrigger
- [ ] schema 服务端下发，确保代码还是 ok（就是初始 schema 为空）
- [ ] schema 服务端下发，做好校验和第一层的报错
- [ ] 关联多个组件的 validation 咋处理？在什么时候触发？touched 是存在每个组件内部的 local 状态，全局的 validation 应该只能是 validator 的形式（函数），书写规范和入参分别是啥？
- [ ] touch system isTouched
- [ ] mapping 系统，要改造
- [ ] slot 的支持
- [ ] default 的展示，比如 checkbox 的字段是 defaultChecked
- [ ] 已有的 widget 的 valuePropsName 和 trigger 的 mapping 补齐
- [ ] readOnly
- [ ] list 和 bind 还是不能共用
- [x] 其他 form.方法，resetFields、submit 等待，目前就一个 getValues
- [ ] 如果 list 对应的是['a','b']这样非 object 的数据咋办
- [x] list 的 pagination 点击页码要有效
- [x] list 相关的校验问题：display 了一个值，一点没动还是会被校验。。
- [ ] list 的校验 delete 的时候会删掉全部
- [ ] 校验， list 的后面几页不渲染，所以都不会校验。。。咋办
- [ ] beforeFinish 这个 hook，执行了之后，传给后续的 state 并没有变化。。

Low priority ones

- [ ] 比如 percentage 组件，动过之后就不会变成 undefined 了，所以如果有校验就会不过（这个情况在正式场景会有问题不？）

## 功能

1. 改写 formData，使用 lodash.set
2. useForm 提取 api 到外层为一个 hooks
3. bind 的功能，字段可以对应不同层的东西
4. onChange 不再需要传 name
5. 简单的组件 binding，valuePropName、trigger、options 直接到同一层
6. createWidget 方法完成
7. 一个组件对应多个字段。支持数组 bind。注意 onChange(['hello', null]) 用 null 来表示不修改第二个值
8. list 的渲染，添加了 dataIndex 的概念
9. 简化了一些自定义组件，直接使用原生的，createWidget 添加 extraSchema 入参
10. 新添加一个 watch
11. submit 和 onFinish 的雏形完成
12. bind: false // list 里的一个字段 bind 的 false 贼难写，之后加
13. touched 判断系统，用于做 validation
14. validation 的雏形
15. 同步的 validation 能够生成{formData, errorFields}
16. UI 更新
17. 字段支持表达式
18. 添加 isEditting 用于优化操作的卡顿

UI 是否框要单独处理
default 值的实现
新建字段 showTitle => 改成 hideTitle，字段的常用行为应该默认是 false
新建字段 hideValidation 意思是没有出现校验文案的时候，不展示校验的块

### submit

1. bind: false 这个需要在 submit 逻辑里取做
2. list 数据的补齐，因为用的 lodash 的 set，其他值可能完全空着
3. bind 的逻辑，是否考虑动态添加了 bind，要把原字段去掉？就像 hidden 是否要考虑这个问题 (这个在 submit 里去做)
4. list 里面空的窟窿，去掉，如果整个没有值，list 整个去掉

### 提供操纵全局的函数（？这块写了一半）

setItemValue(path, value) dataIndex 提供出来，这个是每个 item 上的 rule，分析 path 里有[]的情况，用上 dataIndex 来解析
setBrotherValue(value) 直接封装了

全局：
setItemValue(path, value) path 直接使用带 [] 的方式

## DESIGN

do we really need touched system?

1. 对任何 item，每次 onChange 的时候，都 onValidate。这其实和 touch 没有关系
2. 当 isValidating=true 的时候，所有的 item 都 onValidate。
3. 只要 errorFields 有值，就对应展示

问题：validation 异步的时候，咋知道所有的 validation 都结束了呢？（但这个问题本身和 touched 没有关系）

```js
{a: {b: 1}, c: 2}

{a: $touched, {b: {$touched}}, c: {$touched}}
```

JSON schema 不够用，直接参考 antd 添加新字段。新的字段标准是：1. 使用基本的 JSON schema，所有都用到的字段放最外层，不用加 ui：了，单独几个类型使用的字段放 options

rules & validation

schema 首次计算变成 flatten，同时算好每个 item 的 rules: []

全局记录 error 用 errorFields 状态，提供全局函数 onValidate(rules, value)修改 errorFields, 可 context 下传供每个元素去消费。同时全局的 rules 也可以走这个函数
全局 rules 的处理：
在处理 flatten 的时候把全局 rules 的 ruleId，下发到和他关联的元素上，这样可以在元素级别判断触发。
想使用 touched 状态来控制，但使用全局的 touched 状态很蛋疼，主要是 list 套 list 套 list，太复杂了，到底多少 index。。感觉完全维护了一遍数据。其实也不是不行。就是 formData 扩展，每个 key：value 变成 key：{value, touched}

三种方案。。先用 1 来试试（就是在元素级别 local 管理 touched，和处理 validation，不给出全局的 touched 状态树）

touched 的 design，做一个和 formData 一样的 tree，存放和 data 相关的状态，touched，readOnly（只读模式）

### validation

1. antd 参考

```js
   state:
   touched boolean
   validating boolean
   errors string[]
   name string | number | (string | number)[]
   value any

  rules: {
    enum
    len
    max
    message
    min
    pattern
    required
    type
    whitespace
    validator: func =>
  }

3. errorInfo:

{
  values: {
    username: 'username',
    password: 'password',
  },
// 如果是多个字段联动的 error，允许多个 error
  errorFields: [
    { name: 'a.b.c', errors: ['Please input your Password!'] },
  ],
  outOfDate: false,
}
```

## 我们的

因为 validation 可能是异步的，所以 submit 也会是异步的，这就要避免反复提交

```js
{
  formData: {},
  errorFields: [
    { name: 'a.b.c', errors: ['Please input your Password!'] },
  ],
}
```

然后判断提交在哪一步了，用

提交的流程：

1. 状态

```js
isValidating; // 内部校验完成后结束
其中 isValidating 放成一个statusTree，因为有异步，所以如果一个值，没法判断何时isValidating 变成 false
// 先同步吧
isSubmitting; // 用户处理好了提交信息后算完结
```

单个校验
singleValidation(dataPath, value, item.rules);

2. 流程

最简单的、同步的、不考虑代码效率的（每次都操作）

- 每次 onChange 的时候，onValidate（errorFields 更新），并 setTouched 为 true
- 提交的时候，set isValidating true
- 当 isValidating 从 false 变成 true，所有 field 执行 onValidate （errorFields 更新），隔半秒后 set isValidating false

最终版的改进

- isValidating、isTouched 是个状态 tree，保存在全局
- 开始 submit 整个 tree 的 isValidating = true
- 每条校验完成改变单个的 isValidating = false
- 所有 isValidating 都 false 了，内部校验完成
- 还要考虑外部校验信息的回填

或者最终简版

- 内部校验和最简版一样
- 所有的异步校验使用外部信息回填，提供单独方法

外部回填的思考

- 感觉 list 的场景又会坑，比如一条 rule 如果要复用到整个数组

---分割线--------------------------------

antd

rules
https://ant.design/components/form/#Rule

每个 cell

```
{
  touched
  validating
  errors: []
  name: 'a.b.c'
  value: ""
}
```

formik

isSubmitting
isValidating

## 新支持的场景

1. id 选好，点击请求服务端，回填整个表单的数据
2. 服务端返回的详情数据全在一个 object，但是展示的设计稿需要详情页是复杂的排版
3.

4. form-render 的每一层都可拆卸、可扩展

## layout

参考 antd 的，用 col-row 的结构，然后还有个 inline

### validating status

1. success warning error validating
2.

### idea

bind: false 来决定不动 formData
debug mode：
组件的 widget 不能被识别的时候，展示说明无匹配，然后一个按钮，点击出来对应的 schema。普通 mode 下无视 widget 使用默认组件匹配

### 添头功能

单选可以支持首次有选项，首次不选择
单选可以自动加一个全部（-1）

### Changelog

- 不在传入 options，而是把 options 展开直接传入，1.便于直接使用组件。2.options 这个字段被 select 组件已经使用了

- 打算把 displayType 变成 layout, 并支持三种: horizontal, vertical, inline
- 和 antd 一致、原本那个 key 和 value 命名都有点让人迷惑

```js
// number: 不再支持
const { max, min, step } = p.schema;
// style
{ borderColor: '#ff4d4f', boxShadow: '0 0 0 2px rgba(255,77,79,.2)' }
// createWidget
createWidget = (mapProps, extraSchema)

// 名称
readonly -> readOnly

// 值转化？加一个组件，0/1 checkbox

| "needVoucher": { |      |      |                      |
| ---------------- | ---- | ---- | -------------------- |
|                  |      |      | "title": "电子凭证", |
|                  |      |      | "type": "string",    |
|                  |      |      | "enum": [            |
|                  |      |      | 1,                   |
|                  |      |      | 0                    |
|                  |      |      | ],                   |
|                  |      |      | "enumNames": [       |
|                  |      |      | "使用",              |
|                  |      |      | "不使用"             |
|                  |      |      | ],                   |
|                  |      |      | "ui:widget": "radio" |
|                  |      |      | },                   |

```

// watch 的一个问题，list 底下的字段，比如我要动同一个 item 下的东西，该怎么描述？

```js
watch: {
  a: function (val, path) {
    console.log('new: %s, old: %s', val, oldVal)
  }
}
```

there's value in using schema:

very easy to find error, easily passable and reviewed

## reasons for changes:

1. why not using ui:xxx why stop adopting JSON schema required
   because it's confusing and unnatural and limited to users

- ui start to be doing much more than ui
- required [keys] making no sense, and can't cover edge case like I want a list have at least one item with that item having some field filled
- and it's much more sensible for user to just write required: true in the field, lots of users don't know where to write required on first usage

ui 和 data 的分离，之后的想法，crud 的简单生成。服务端提供 增改查

## Q&A

为啥在 App 里 log 一下，提交的时候会 log 4 次？

1. 首次渲染（？）
2. isSubmitting true isValidating true
3. isSubmitting false isValidating true
4. isSubmitting false isValidating false

## Why schema is a good approach?

1. makes it extremely easiy to 复现问题、传播推广
