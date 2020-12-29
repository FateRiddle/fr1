import React from 'react';
import { Switch } from 'antd';

export default function sw({ disabled, readonly, onChange, value, ...rest }) {
  return (
    <Switch
      disabled={disabled || readonly}
      onChange={onChange}
      checked={value}
    />
  );
}
