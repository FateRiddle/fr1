## 功能

1. 改写 formData，使用 lodash.set
2. useForm 提取 api 到外层为一个 hooks
3. bind 的功能，字段可以对应不同层的东西
4. onChange 不再需要传 name
5. 简单的组件 binding，valuePropName、trigger、options 直接到同一层
6. createWidget 方法完成
7. 一个组件对应多个字段。支持数组 bind。注意 onChange(['hello', null]) 用 null 来表示不修改第二个值

## 新支持的场景

1. id 选好，点击请求服务端，回填整个表单的数据
2. 服务端返回的详情数据全在一个 object，但是展示的设计稿需要详情页是复杂的排版
3. 关联到多个组件的校验
4. form-render 的每一层都可拆卸、可扩展

## 架构

JSON schema 不够用，直接参考 antd 添加新字段。新的字段标准是：1. 使用基本的 JSON schema，所有都用到的字段放最外层，不用加 ui：了，单独几个类型使用的字段放 options

TODO

- [ ] bind 的逻辑，是否考虑动态添加了 bind，要把原字段去掉？就像 hidden 是否要考虑这个问题
- [ ] readOnly
- [ ] list 的渲染
- [ ] default 的展示，比如 checkbox 的字段是 defaultChecked
- [ ] 其他 form.方法，resetFields、submit 等待，目前就一个 getValues

8. bind: false 这个需要在 submit 逻辑里取做

idea

bind: false 来决定不动 formData
