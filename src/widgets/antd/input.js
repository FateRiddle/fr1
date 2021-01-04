import React from 'react';
import { Input } from 'antd';

export default function input({ value, onChange, schema, disabled, options }) {
  const { format = 'text' } = schema;
  const type = format;
  return (
    <Input
      {...options}
      value={value}
      type={type}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
