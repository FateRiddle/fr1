import React from 'react';
import { getWidgetName, extraSchemaList } from '../../mapping';
import { defaultWidgetNameList } from '../../widgets/antd';
import { useStore } from '../../hooks';

const ExtendedWidget = ({
  schema,
  onChange,
  value,
  children,
  onItemChange,
}) => {
  const { widgets, mapping } = useStore();

  // TODO: 计算是哪个widget，需要优化
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

  const wProps = {
    schema,
    onChange,
    value,
    children,
  };

  // 避免传组件不接受的props，按情况传多余的props
  const isExternalWidget = defaultWidgetNameList.indexOf(widgetName) === -1; // 是否是外部组件
  if (isExternalWidget) {
    wProps.onItemChange = onItemChange; // 只给外部组件提供，默认的组件都是简单组件，不需要，多余的props会warning，很烦
  }

  const widgetProps_extend = {
    ...wProps,
    ...extraSchemaList[widgetName],
  };

  return Widget && <Widget {...widgetProps_extend}>{children}</Widget>;
};

export default ExtendedWidget;
