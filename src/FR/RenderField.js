import React, { useEffect, useMemo } from 'react';
import { useStore } from '../hooks';
import { get } from 'lodash';
import { isLooselyNumber, isCssLength, getParentProps } from '../utils';
import { createWidget } from '../HOC';
import { getWidgetName } from '../mapping';

const RenderField = ({
  $id,
  item,
  labelClass,
  contentClass,
  isComplex,
  children,
}) => {
  const { schema } = item;
  const {
    onItemChange,
    flatten,
    formData,
    widgets,
    mapping,
    frProps = {},
  } = useStore();
  // 计算数据的真实路径，bind字段会影响
  let dataPath = $id;
  const isMultiPaths =
    Array.isArray(schema.bind) &&
    schema.bind.every(item => typeof item === 'string');
  if (schema && schema.bind) {
    if (typeof schema.bind === 'string' || isMultiPaths) {
      dataPath = schema.bind;
    }
  }
  // 3种情况，"#"、"a.b.c"、["a.b.c", "e.d.f"]
  const getValue = () => {
    if (dataPath === '#') {
      return formData;
    } else if (typeof dataPath === 'string') {
      return get(formData, dataPath);
    } else if (isMultiPaths) {
      return dataPath.map(path => get(formData, path));
    }
  };

  const _value = getValue(dataPath, formData);
  const { labelWidth, displayType, showDescIcon, showValidate } = frProps;
  const { title, description, required } = schema;
  const isRequired = required && required.length > 0;

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
  const MyWidget = useMemo(() => createWidget()(Widget), [widgetName]);

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
  } else if (isComplex || displayType === 'column') {
    labelStyle = { flexGrow: 1 };
  }

  const onChange = value => {
    if (isMultiPaths && Array.isArray(value)) {
      dataPath.forEach((p, idx) => {
        if (value[idx] === null) return; // TODO: 为了允许onChange只改部分值，如果传null就不改。想一想会不会有确实需要改值为null的可能？
        onItemChange(p, value[idx]);
      });
    } else {
      onItemChange(dataPath, value);
    }
  };

  let contentStyle = {};
  if (widgetName === 'checkbox' && displayType === 'row') {
    contentStyle.marginLeft = effectiveLabelWidth;
  }

  const widgetProps = {
    schema,
    onChange,
    onItemChange,
    value: _value,
    children,
  };

  return (
    <>
      {schema.title ? (
        <div className={labelClass} style={labelStyle}>
          <label
            className={`fr-label-title ${
              widgetName === 'checkbox' || displayType === 'column'
                ? 'no-colon'
                : ''
            }`} // checkbox不带冒号
            title={title}
          >
            {isRequired && <span className="fr-label-required"> *</span>}
            <span
              className={`${isComplex ? 'b' : ''} ${
                displayType === 'column' ? 'flex-none' : ''
              }`}
            >
              {title}
            </span>
            {description &&
              (showDescIcon ? (
                <span className="fr-tooltip-toggle" aria-label={description}>
                  <i className="fr-tooltip-icon" />
                  <div className="fr-tooltip-container">
                    <i className="fr-tooltip-triangle" />
                    {description}
                  </div>
                </span>
              ) : (
                <span className="fr-desc ml2">(&nbsp;{description}&nbsp;)</span>
              ))}
            {displayType !== 'row' && showValidate && (
              <span className="fr-validate">validation</span>
            )}
          </label>
        </div>
      ) : null}
      <div className={contentClass} style={contentStyle}>
        {MyWidget && <MyWidget {...widgetProps} />}
      </div>
    </>
  );
};

export default RenderField;
