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
11. validation 的雏形
12. touched

validation:

````js
# state
touched	boolean
validating	boolean
errors	string[]
name	string | number | (string | number)[]
value	any

# rules: {
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

# errorInfo:
{
  values: {
    username: 'username',
    password: 'password',
  },
  // 如果是多个字段联动的error，允许多个error
  errorFields: [
    { name: 'a.b.c', errors: ['Please input your Password!'] },
  ],
  outOfDate: false,
}

我们的

因为validation可能是异步的，所以submit也会是异步的，这就要避免反复提交

```js
{
  formData: {},
  errorFields: [
    { name: 'a.b.c', errors: ['Please input your Password!'] },
  ],
}
````

然后判断提交在哪一步了，用

```js
isSubmitting;
isValidating;
```

antd

rules
https://ant.design/components/form/#Rule

每个 cell
{
touched
validating
errors: []
name: 'a.b.c'
value: ""
}

formik
isSubmitting
isValidating

````

## 新支持的场景

1. id 选好，点击请求服务端，回填整个表单的数据
2. 服务端返回的详情数据全在一个 object，但是展示的设计稿需要详情页是复杂的排版
3.

4. form-render 的每一层都可拆卸、可扩展

## layout

参考 antd 的，用 col-row 的结构，然后还有个 inline

## 架构

JSON schema 不够用，直接参考 antd 添加新字段。新的字段标准是：1. 使用基本的 JSON schema，所有都用到的字段放最外层，不用加 ui：了，单独几个类型使用的字段放 options

TODO

- [ ] touch system isTouched
- [ ] mapping 系统，要改造
- [ ] slot 的支持
- [ ] default 的展示，比如 checkbox 的字段是 defaultChecked
- [ ] 已有的 widget 的 valuePropsName 和 trigger 的 mapping 补齐
- [ ] 校验
- [ ] readOnly
- [ ] list 和 bind 还是不能共用
- [ ] 其他 form.方法，resetFields、submit 等待，目前就一个 getValues

### validating status

1. success warning error validating
2.

### submit

1. bind: false 这个需要在 submit 逻辑里取做
2. list 数据的补齐，因为用的 lodash 的 set，其他值可能完全空着
3. bind 的逻辑，是否考虑动态添加了 bind，要把原字段去掉？就像 hidden 是否要考虑这个问题 (这个在 submit 里去做)

setItemValue(path, value)
setItemValue(path, value)：
setItemValue(path, value) dataIndex 提供出来，这个是每个 item 上的 rule，分析 path 里有[]的情况，用上 dataIndex 来解析
setBrotherValue(value) 直接封装了

全局：
setItemValue(path, value) path 直接使用带 [] 的方式，

idea

bind: false 来决定不动 formData
debug mode：
组件的 widget 不能被识别的时候，展示说明无匹配，然后一个按钮，点击出来对应的 schema。普通 mode 下无视 widget 使用默认组件匹配

### ChangeLog

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

````

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
