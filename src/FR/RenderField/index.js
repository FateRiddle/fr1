import React, { useEffect, useRef } from 'react';
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
  isObject,
} from '../../utils';
import ErrorMessage from './ErrorMessage';
import FieldTitle from './Title';
import ExtendedWidget from './ExtendedWidget';

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
    isValidating,
    displayType,
    isEditing,
    setEditing,
    watch,
    extend,
  } = useStore();

  const snapShot = useRef(schema);

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
  let _schema = snapShot.current;
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

  // check: 由于是专门针对checkbox的，目前只好写这里
  let _labelStyle = labelStyle;
  if (isCheckBoxType(_schema)) {
    _labelStyle = { flexGrow: 1 };
  }

  let contentStyle = {};
  if (isCheckBoxType(_schema) && displayType === 'row') {
    contentStyle.marginLeft = labelStyle.width;
  }

  const outMapProps = isObject(extend) && extend[dataPath];
  const _outMapProps =
    typeof outMapProps === 'function' ? outMapProps : () => {};

  const singleValidation = (path, value, rules) => {
    if (Array.isArray(rules) && rules.length > 0) {
      onItemValidate(path, value, rules);
    }
  };

  const debouncedSetEditing = useDebouncedCallback(setEditing, 350);

  // TODO: 优化一下，只有touch还是false的时候，setTouched
  const onChange = (value, justValidate = false) => {
    // 开始编辑，节流
    setEditing(true);
    debouncedSetEditing.callback(false);
    if (isObject(watch) && typeof watch[dataPath] === 'function') {
      watch[dataPath](value);
    }
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

  const titleProps = {
    labelClass,
    labelStyle: _labelStyle,
    schema: _schema,
  };

  const placeholderTitleProps = {
    className: labelClass,
    style: _labelStyle,
  };

  const _showTitle = !hideTitle && !!_schema.title;

  const _hideValidation =
    isObjType(_schema) || (hideValidation && !errorMessage);

  const widgetProps = {
    schema: _schema,
    onChange,
    value: _value,
    onItemChange,
  };

  widgetProps.children = hasChildren
    ? children
    : isCheckBoxType(_schema)
    ? _schema.title
    : null;

  // checkbox必须单独处理，布局太不同了
  if (isCheckBoxType(_schema)) {
    return (
      <>
        {_showTitle && <div {...placeholderTitleProps} />}
        <div className={contentClass} style={contentStyle}>
          <ExtendedWidget {...widgetProps} />
          {_hideValidation ? null : <ErrorMessage message={errorMessage} />}
        </div>
      </>
    );
  }

  return (
    <>
      {_showTitle && <FieldTitle {...titleProps} />}
      <div className={contentClass} style={contentStyle}>
        <ExtendedWidget {...widgetProps} />
        {_hideValidation ? null : <ErrorMessage message={errorMessage} />}
      </div>
    </>
  );
};

export default RenderField;
