import React, { useMemo, useEffect } from 'react';
import { useStore } from '../../hooks';
import {
  isLooselyNumber,
  isCssLength,
  getParentProps,
  getDataPath,
  getValueByPath,
} from '../../utils';
import { createWidget } from '../../HOC';
import { getWidgetName, extraSchemaList } from '../../mapping';
import { defaultWidgetNameList } from '../../widgets/antd';
import ErrorMessage from './ErrorMessage';
import FieldTitle from './Title';

// TODO: 之后不要直接用get，收口到一个内部方法getValue，便于全局 ctrl + f 查找
const RenderField = ({
  $id,
  dataIndex,
  item,
  labelClass,
  contentClass,
  hasChildren,
  children,
  errorFields = [],
}) => {
  const { schema } = item;
  const {
    onItemChange,
    onItemValidate,
    flatten,
    formData,
    widgets,
    mapping,
    isValidating,
    labelWidth,
    displayType,
  } = useStore();
  const isObjType = true;
  // const isObjType = schema.type === 'object'; //TODO: 补全 & 统一判断
  // 计算数据的真实路径，bind字段会影响
  let dataPath = getDataPath($id, dataIndex);
  // TODO: bind 允许bind数组，如果是bind数组，需要更多的处理
  const isMultiPaths =
    Array.isArray(schema.bind) &&
    schema.bind.every(item => typeof item === 'string');
  if (schema && schema.bind) {
    if (typeof schema.bind === 'string') {
      dataPath = getDataPath(schema.bind, dataIndex);
    } else if (isMultiPaths) {
      dataPath = schema.bind.map(b => getDataPath(b, dataIndex));
    }
  }

  const errObj = errorFields.find(err => err.name === dataPath);
  const errList = errObj && errObj.error;
  const errorMessage = Array.isArray(errList) ? errList[0] : undefined;
  errorMessage && console.log(errorMessage);

  useEffect(() => {
    if (isValidating) {
      onChange(_value, true);
    }
  }, [isValidating]);

  // dataPath 有3种情况："#"、"a.b.c"、["a.b.c", "e.d.f"]
  const getValue = () => {
    if (isMultiPaths) {
      return dataPath.map(path => getValueByPath(formData, path));
    }
    return getValueByPath(formData, dataPath);
  };

  // 从全局 formData 获取 value
  const _value = getValue(dataPath, formData);
  let widgetName = getWidgetName(schema, mapping);
  const customWidget = schema['ui:widget'];
  if (customWidget && widgets[customWidget]) {
    widgetName = customWidget;
  }
  let Widget = widgets[widgetName];
  // 如果不存在，比如有外部的自定义组件名称，使用默认展示组件
  if (!Widget) {
    const defaultSchema = { ...schema };
    delete defaultSchema['ui:widget'];
    widgetName = getWidgetName(defaultSchema, mapping);
    Widget = widgets[widgetName] || widgets['input'];
  }

  // 使用useMemo，终于搞定了！如果这里不限制会每次都重复创建组件，不仅有性能问题，还会造成光标丢失
  const MyWidget = useMemo(
    () => createWidget(null, extraSchemaList[widgetName])(Widget),
    [widgetName]
  );

  // if (widgetName === 'multiSelect') {
  //   console.log(schema['ui:widget'], customWidget, Widget);
  // }
  // 真正有效的label宽度需要从现在所在item开始一直往上回溯（设计成了继承关系），找到的第一个有值的 ui:labelWidth
  const effectiveLabelWidth =
    getParentProps('ui:labelWidth', $id, flatten) || labelWidth;
  const _labelWidth = isLooselyNumber(effectiveLabelWidth)
    ? Number(effectiveLabelWidth)
    : isCssLength(effectiveLabelWidth)
    ? effectiveLabelWidth
    : 110; // 默认是 110px 的长度

  let labelStyle = { width: _labelWidth };
  if (widgetName === 'checkbox') {
    labelStyle = { flexGrow: 1 };
  } else if (isObjType || displayType !== 'column') {
    labelStyle = { flexGrow: 1 };
  }

  const singleValidation = (path, value, rules) => {
    if (Array.isArray(rules) && rules.length > 0) {
      onItemValidate(path, value, rules);
    }
  };

  // TODO: 优化一下，只有touch还是false的时候，setTouched
  const onChange = (value, justValidate = false) => {
    if (isMultiPaths) {
      if (Array.isArray(value)) {
        dataPath.forEach((p, idx) => {
          if (value[idx] === null) return; // TODO: 为了允许onChange只改部分值，如果传null就不改。想一想会不会有确实需要改值为null的可能？
          singleValidation(p, value[idx], item.rules);
          !justValidate && onItemChange(p, value[idx]);
          // !justValidate && setTouched(p, true);
        });
      }
    } else if (typeof dataPath === 'string') {
      singleValidation(dataPath, value, item.rules);
      !justValidate && onItemChange(dataPath, value);
      // !justValidate && setTouched(dataPath, true);
    }
  };

  let contentStyle = {};
  if (widgetName === 'checkbox' && displayType === 'row') {
    contentStyle.marginLeft = effectiveLabelWidth;
  }

  const widgetProps = {
    schema,
    onChange,
    value: _value,
  };

  if (hasChildren) {
    widgetProps.children = children;
  }

  // 避免传组件不接受的props，按情况传多余的props
  const isExternalWidget = defaultWidgetNameList.indexOf(widgetName) === -1; // 是否是外部组件
  if (isExternalWidget) {
    widgetProps.onItemChange = onItemChange; // 只给外部组件提供，默认的组件都是简单组件，不需要，多余的props会warning，很烦
  }

  const titleProps = { labelClass, labelStyle, widgetName, schema };

  return (
    <>
      {!!schema.title && <FieldTitle {...titleProps} />}
      <div className={contentClass} style={contentStyle}>
        {MyWidget && <MyWidget {...widgetProps} />}
        <ErrorMessage message={errorMessage} />
      </div>
    </>
  );
};

export default RenderField;
