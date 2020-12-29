import * as React from 'react';
import { flattenSchema } from './utils';
import FR from './FR';
import { Ctx, StoreCtx, useSet } from './hooks';
import { widgets as defaultWidgets } from './widgets/antd';
import { mapping as defaultMapping } from './mapping';
import { set } from 'lodash';
// import './atom.css';

export const useForm = () => {
  const [state, setState] = useSet({
    formData: {}, // TODO: 初始值从外部传入
  });
  const { formData } = state;

  const onItemChange = (id, value) => {
    if (typeof id !== 'string') return;
    if (id === '#') {
      setState({ formData: value });
      return;
    }
    const newFormData = set(formData, id, value);
    setState({ formData: newFormData });
  };

  const getValues = () => formData;

  const form = {
    onItemChange,
    formData,
    getValues,
  };
  return form;
};

function App({ schema, flatten, widgets, mapping, form, ...rest }) {
  const _flatten = flatten || flattenSchema(schema);
  // console.log(_flatten, form.formData);

  const store = {
    ...form,
    flatten: _flatten,
    widgets: { ...defaultWidgets, ...widgets },
    mapping: { ...defaultMapping, ...mapping },
    ...rest,
  };

  // TODO: Ctx 这层暂时不用，所有都放在StoreCtx，之后性能优化在把一些常量的东西提取出来
  return (
    <StoreCtx.Provider value={store}>
      <Ctx.Provider value={{}}>
        <div className="fr-wrapper">
          <FR />
        </div>
      </Ctx.Provider>
    </StoreCtx.Provider>
  );
}

export default App;
