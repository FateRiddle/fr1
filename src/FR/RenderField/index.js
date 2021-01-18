import React, { useMemo, useEffect, useState } from 'react';
import { useStore } from '../../hooks';
import useDebouncedCallback from 'use-debounce/lib/useDebouncedCallback';
import {
  getDataPath,
  getValueByPath,
  isCheckBoxType,
  isObjType,
  schemaContainsExpression,
  parseAllExpression,
  parseSingleExpression,
  isExpression,
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
  labelStyle,
  contentClass,
  hasChildren,
  children,
  errorFields = [],
  hideTitle,
  hideValidation,
}) => {
  const { schema } = item;
  const {
    onItemChange,
    onItemValidate,
    formData,
    widgets,
    mapping,
    isValidating,
    displayType,
    isEditing,
    setEditing,
  } = useStore();

  const [snapShot, setSnapShot] = useState(() => schema);

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

  // 解析schema
  let _schema = { ...schema }; // TODO: 这儿用 _ 用的不太统一，就是懒
  let _rules = [...item.rules];

  // 节流部分逻辑，编辑时不执行
  if (!isEditing) {
    if (schemaContainsExpression(_schema)) {
      _schema = parseAllExpression(_schema, formData, dataPath);
    }
    _rules = _rules.map(rule => {
      // if (rule.required) debugger;
      const newRule = {};
      Object.keys(rule).forEach(key => {
        const needParse = isExpression(rule[key]);
        newRule[key] = needParse
          ? parseSingleExpression(rule[key], formData, dataPath)
          : rule[key];
      });
      return newRule;
    });
  } else {
  }

  useEffect(() => {
    if (!isEditing) {
      setSnapShot(_schema);
    }
  }, [isEditing]);

  _schema = isEditing ? snapShot : _schema;

  const errObj = errorFields.find(err => err.name === dataPath);
  const errList = errObj && errObj.error;
  const errorMessage = Array.isArray(errList) ? errList[0] : undefined;

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

  // TODO: 计算是哪个widget，需要优化
  let widgetName = getWidgetName(_schema, mapping);
  const customWidget = _schema['ui:widget'];
  if (customWidget && widgets[customWidget]) {
    widgetName = customWidget;
  }
  let Widget = widgets[widgetName];
  // 如果不存在，比如有外部的自定义组件名称，使用默认展示组件
  if (!Widget) {
    const defaultSchema = { ..._schema };
    delete defaultSchema['ui:widget'];
    widgetName = getWidgetName(defaultSchema, mapping);
    Widget = widgets[widgetName] || widgets['input'];
  }

  // check: 由于是专门针对checkbox的，目前只好写这里
  let _labelStyle = labelStyle;
  if (widgetName === 'checkbox') {
    _labelStyle = { flexGrow: 1 };
  }

  let contentStyle = {};
  if (widgetName === 'checkbox' && displayType === 'row') {
    contentStyle.marginLeft = labelStyle.width;
  }

  // 使用useMemo，终于搞定了！如果这里不限制会每次都重复创建组件，不仅有性能问题，还会造成光标丢失
  const MyWidget = useMemo(
    () => createWidget(null, extraSchemaList[widgetName])(Widget),
    [widgetName]
  );

  const singleValidation = (path, value, rules) => {
    if (Array.isArray(rules) && rules.length > 0) {
      onItemValidate(path, value, rules);
    }
  };

  const debouncedSetEditing = useDebouncedCallback(setEditing, 500);

  // TODO: 优化一下，只有touch还是false的时候，setTouched
  const onChange = (value, justValidate = false) => {
    // 开始编辑，节流
    setEditing(true);
    debouncedSetEditing.callback(false);
    if (isMultiPaths) {
      if (Array.isArray(value)) {
        dataPath.forEach((p, idx) => {
          if (value[idx] === null) return; // TODO: 为了允许onChange只改部分值，如果传null就不改。想一想会不会有确实需要改值为null的可能？
          singleValidation(p, value[idx], _rules);
          !justValidate && onItemChange(p, value[idx]);
          // !justValidate && setTouched(p, true);
        });
      }
    } else if (typeof dataPath === 'string') {
      singleValidation(dataPath, value, _rules);
      !justValidate && onItemChange(dataPath, value);
      // !justValidate && setTouched(dataPath, true);
    }
  };

  const widgetProps = {
    schema: _schema,
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

  const titleProps = {
    labelClass,
    labelStyle: _labelStyle,
    widgetName,
    schema: _schema,
  };

  const placeholderTitleProps = {
    className: labelClass,
    style: _labelStyle,
  };

  const _showTitle = !hideTitle && !!_schema.title;

  const _hideValidation =
    isObjType(_schema) || (hideValidation && !errorMessage);

  // checkbox必须单独处理，布局太不同了
  if (isCheckBoxType(_schema)) {
    return (
      <>
        {_showTitle && <div {...placeholderTitleProps} />}
        <div className={contentClass} style={contentStyle}>
          {MyWidget && <MyWidget {...widgetProps}>{_schema.title}</MyWidget>}
          {_hideValidation ? null : <ErrorMessage message={errorMessage} />}
        </div>
      </>
    );
  }

  return (
    <>
      {_showTitle && <FieldTitle {...titleProps} />}
      <div className={contentClass} style={contentStyle}>
        {MyWidget && <MyWidget {...widgetProps} />}
        {_hideValidation ? null : <ErrorMessage message={errorMessage} />}
      </div>
    </>
  );
};

export default RenderField;
