import React from 'react';
import { RenderList, RenderObject } from './RenderChildren';
import RenderField from './RenderField';
import { useStore } from '../hooks';
import { isListType } from '../utils';

const FR = ({ id = '#', dataIndex = [] }) => {
  const { displayType = 'row', column, flatten, errorFields } = useStore();
  const item = flatten[id];
  if (!item) return null;

  const { schema } = item;
  const isObjType = schema.type === 'object'; // TODO: 这个好像太笼统了，万一不是这样呢
  const isList = isListType(schema);
  const width = schema['ui:width'];
  let containerClass = 'fr-field w-100 ba flex';
  let labelClass = 'fr-label debug-grid';
  let contentClass = 'fr-content';

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

  // 横排时
  const isCheckBox =
    schema.type === 'boolean' && schema['ui:widget'] !== 'switch';
  if (displayType === 'row') {
    labelClass = labelClass.replace('mb2', 'mb0');
    if (!isObjType && !isCheckBox) {
      containerClass += ' flex items-center';
      labelClass += ' flex-shrink-0 fr-label-row';
      labelClass = labelClass.replace('mb2', 'mb0');
      contentClass += ' flex-grow-1 relative';
    }
    // 横排的checkbox
    if (isCheckBox) {
      contentClass += ' flex justify-end pr2';
    }
  } else {
    switch (schema.type) {
      case 'object':
        if (schema.title) {
          containerClass += ' pt4 pr3 pb2 relative mb4'; // object的margin bottom由内部元素撑起
          labelClass += ' fr-label-object'; // fr-label-object 无默认style，只是占位用于使用者样式覆盖
        }
        containerClass += ' fr-field-object'; // object的margin bottom由内部元素撑起
        if (schema.title) {
          contentClass += ' ml3'; // 缩进
        }
        break;
      case 'array':
        if (schema.title && !schema.enum) {
          labelClass += ' mt2 mb3';
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
  }

  const hasChildren = item.children && item.children.length > 0;

  const fieldProps = {
    $id: id,
    dataIndex,
    item,
    labelClass,
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
