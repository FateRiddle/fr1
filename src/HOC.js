import { defaultGetValueFromEvent } from './utils';
// TODO: props传入的值，之后要改造
// mention: createWidget 设计的构架，保证了可以多次使用套壳，而不会互相影响。内部使用了一遍用于解析schema上的字段trigger, valuePropName。外部生成自定义组件的时候还可以再套一层，用于解析 propsMap
export const createWidget = mapProps => Component => props => {
  const { onChange, value, schema, ...rest } = props;
  const { trigger, valuePropName } = schema || {};
  const controlProps = {};
  let _valuePropName = 'value';
  if (valuePropName && typeof valuePropName === 'string') {
    _valuePropName = valuePropName;
    controlProps[valuePropName] = value;
  } else {
    controlProps.value = value;
  }
  const _onChange = (...args) => {
    const newValue = defaultGetValueFromEvent(_valuePropName, ...args);
    onChange(newValue);
  };
  if (trigger && typeof trigger === 'string') {
    controlProps[trigger] = _onChange;
  } else {
    controlProps.onChange = _onChange;
  }

  // TODO: 之后 ui:xx 会舍去
  const usedPropsFromSchema = {
    disabled: schema['ui:disabled'],
    readonly: schema['ui:readonly'],
    hidden: schema['ui:hidden'],
    options: schema['ui:options'],
    labelWidth: schema['ui:labelWidth'],
    width: schema['ui:width'],
  };

  const propsMap = typeof mapProps === 'function' ? mapProps(props) : {};

  const _props = {
    ...controlProps,
    schema,
    ...usedPropsFromSchema,
    ...rest,
    ...propsMap, //TODO: propsMap 需要验证一下是否为object
  };

  return <Component {..._props} />;
};
