import React from 'react';
import { RenderList, RenderObject } from './RenderChildren';
import RenderField from './RenderField';
import { useStore } from '../hooks';
import {
  isLooselyNumber,
  isCssLength,
  getParentProps,
  isListType,
} from '../utils';

const FR = ({ id = '#', dataIndex = [] }) => {
  const {
    displayType = 'row',
    column,
    flatten,
    errorFields,
    labelWidth,
  } = useStore();
  const item = flatten[id];
  if (!item) return null;

  const { schema } = item;
  const isObjType = schema.type === 'object'; // TODO: 这个好像太笼统了，万一不是这样呢
  const isList = isListType(schema);
  const isComplex = isObjType || isList;
  const isCheckBox =
    schema.type === 'boolean' && schema['ui:widget'] !== 'switch'; // TODO: 感觉有点不准
  const width = schema['ui:width'];
  let containerClass = `fr-field w-100 flex`;
  let labelClass = `fr-label`;
  let contentClass = `fr-content`;
  // common classNames dispite row or column
  switch (schema.type) {
    case 'object':
      if (isObjType) {
        if (schema.title) {
          labelClass += ' fr-label-group';
        }
        containerClass += ' fr-field-object';
      }
      break;
    case 'array':
      // list 有两种展示形式！
      if (isList) {
        if (schema.title) {
          labelClass += ' fr-label-group';
        }
        containerClass += ' fr-field-column';
      }
      break;
    case 'boolean':
      if (schema['ui:widget'] !== 'switch') {
        if (schema.title) {
          labelClass += ' ml2';
          labelClass = labelClass.replace('mb2', 'mb0');
        }
        contentClass += ' flex items-center'; // checkbox高度短，需要居中对齐
        containerClass += ' flex items-center flex-row-reverse justify-end';
      }
      break;
    default:
  }
  // column specific className
  if (!isComplex) {
    if (displayType === 'column') {
      containerClass += ' flex-column';
      labelClass += ' fr-label-column';
      contentClass += ' fr-content-column';
      switch (schema.type) {
        case 'object':
          break;
        case 'array':
          if (schema.title && !schema.enum) {
            // labelClass += ' b mb2';
          }
          break;
        case 'boolean':
          if (schema['ui:widget'] !== 'switch') {
            if (schema.title) {
              labelClass += ' ml2';
              labelClass = labelClass.replace('mb2', 'mb0');
            }
            contentClass += ' flex items-center'; // checkbox高度短，需要居中对齐
            containerClass += ' flex items-center flex-row-reverse justify-end';
          }
          break;
        default:
      }
    } else if (displayType === 'row') {
      // row specific className
      containerClass += '';
      labelClass += ' fr-label-row';
      contentClass += ' fr-content-row';
      if (!isObjType && !isCheckBox) {
        labelClass += ' flex-shrink-0 fr-label-row';
        contentClass += ' flex-grow-1 relative';
      }
      // 横排的checkbox
      if (isCheckBox) {
        contentClass += ' flex justify-end pr2';
      }
    }
  }

  // style part
  let columnStyle = {};
  if (!isObjType) {
    if (width) {
      columnStyle = {
        width,
        paddingRight: '12px',
      };
    } else if (column > 1) {
      columnStyle = {
        width: `calc(100% /${column})`,
        paddingRight: '12px',
      };
    }
  }

  // 真正有效的label宽度需要从现在所在item开始一直往上回溯（设计成了继承关系），找到的第一个有值的 ui:labelWidth
  const effectiveLabelWidth =
    getParentProps('ui:labelWidth', id, flatten) || labelWidth;
  const _labelWidth = isLooselyNumber(effectiveLabelWidth)
    ? Number(effectiveLabelWidth)
    : isCssLength(effectiveLabelWidth)
    ? effectiveLabelWidth
    : 110; // 默认是 110px 的长度

  let labelStyle = { width: _labelWidth };
  if (isComplex || displayType === 'column') {
    labelStyle = { flexGrow: 1 };
  }

  const hasChildren = item.children && item.children.length > 0;

  const fieldProps = {
    $id: id,
    dataIndex,
    item,
    labelClass,
    labelStyle,
    contentClass,
    errorFields,
    hasChildren,
  };

  const objChildren = hasChildren ? (
    <ul className={`flex flex-wrap pl0`}>
      <RenderObject dataIndex={dataIndex}>{item.children}</RenderObject>
    </ul>
  ) : null;

  const listChildren = hasChildren ? (
    <ul className={`flex flex-wrap pl0`}>
      <RenderList parentId={id} dataIndex={dataIndex}>
        {item.children}
      </RenderList>
    </ul>
  ) : null;

  // TODO: list 也要算进去
  return (
    <div style={columnStyle} className={containerClass}>
      <RenderField {...fieldProps}>
        {isObjType && objChildren}
        {isList && listChildren}
      </RenderField>
    </div>
  );
};

export default FR;

// const FieldWrapper = ({ children, ...rest }) => {
//   const fieldProps = { ...rest };
//   return React.cloneElement(children, fieldProps);
// };
