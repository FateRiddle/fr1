import React from 'react';
import { flattenSchema } from './utils';
import FR from './FR';
import { Ctx, StoreCtx, useSet } from './hooks';
import { widgets as defaultWidgets } from './widgets/antd';
import { mapping as defaultMapping } from './mapping';
import { set } from 'lodash';
// import './atom.css';

function App({ schema, flatten, widgets, mapping, ...rest }) {
  const _flatten = flatten || flattenSchema(schema);
  const [state, setState] = useSet({
    formData: {}, // TODO: 初始值从外部传入
  });

  const { formData } = state;

  const onItemChange = (id, newData) => {
    if (typeof id !== 'string') return;
    if (id[0] !== '#') return;
    if (id === '#') {
      setState({ formData: newData });
      return;
    }
    let path = id.substring(2);
    console.log(id, newData, formData);
    const newFormData = set(formData, path, newData);
    console.log(newFormData);
    setState({ formData: newFormData });
  };

  const store = {
    flatten: _flatten,
    onItemChange,
    formData,
    widgets: { ...defaultWidgets, ...widgets },
    mapping: { ...defaultMapping, ...mapping },
    ...rest,
  };

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
