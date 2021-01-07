import React from 'react';
import { Select } from 'antd';
import { createWidget } from '../../HOC';
import { getArray } from '../../utils';

const mapProps = ({ schema, options: config }) => {
  const { enum: enums, enumNames } = schema || {};
  const options = getArray(enums).map((item, idx) => {
    let label = enumNames && Array.isArray(enumNames) ? enumNames[idx] : item;
    const isHtml = typeof label === 'string' && label[0] === '<';
    if (isHtml) {
      label = <span dangerouslySetInnerHTML={{ __html: label }} />;
    }
    return { label, value: item };
  });

  return {
    options,
    style: { width: '100%', ...(config && config.style) },
    ...config,
  };
};

export default createWidget(mapProps)(Select);
