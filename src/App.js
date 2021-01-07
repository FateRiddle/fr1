import React, { useEffect } from 'react';
import { flattenSchema, getDataPath } from './utils';
import FR from './FR';
import { Ctx, StoreCtx, useSet } from './hooks';
import { widgets as defaultWidgets } from './widgets/antd';
import { mapping as defaultMapping } from './mapping';
import { set, unset } from 'lodash';
// import './atom.css';

export const useForm = ({ schema, flatten }) => {
  const [state, setState] = useSet({
    formData: {}, // TODO: 初始值从外部传入
    watchConfig: {}, // 所有全局的watch，类似vue
    results: {},
    submitResult: {},
    isValidating: false,
    isSubmitting: false,
  });
  const {
    formData,
    watchConfig,
    submitResult,
    isValidating,
    isSubmitting,
  } = state;

  const _flatten = flatten || flattenSchema(schema);

  const onItemChange = (path, value) => {
    if (typeof path !== 'string') return;
    if (path === '#') {
      setState({ formData: value });
      return;
    }
    const newFormData = set(formData, path, value);
    setState({ formData: newFormData });
  };

  const getValues = () => formData;

  const watch = watchConfig => setState({ watchConfig });

  const submit = () => {
    setState({ isValidating: true, isSubmitting: true });
    //  https://formik.org/docs/guides/form-submission
    // TODO: 更多的处理，注意处理的时候一定要是copy一份formData，否则submitresult会和表单操作实时同步的。。而不是submit再变动了
    const processData = data => {
      let _data = JSON.parse(JSON.stringify(data));
      const unbindKeys = Object.keys(_flatten)
        .map(key => {
          const bind =
            _flatten[key] && _flatten[key].schema && _flatten[key].schema.bind;
          if (bind === false) {
            return key;
          }
          return undefined;
        })
        .filter(key => !!key);
      const removeUnbindData = _data => {
        unbindKeys.forEach(key => {
          if (key.indexOf('[]') === -1) {
            _data = unset(_data, key); // TODO: 光remove了一个key，如果遇到remove了那个key上层的object为空了，object是不是也要去掉。。。不过感觉是伪需求
          } else {
            const keys = key.split('[]').filter(k => !!k);
            // TODO: 贼复杂，之后写吧
          }
        });
      };
      removeUnbindData(_data);
      console.log('unbind', unbindKeys);
      return _data;
    };
    setState({
      submitResult: { formData: processData(formData), errorFields: [] },
      isValidating: false,
    });
  };

  const resetFields = () => {
    setState({ formData: {} });
  };

  const setValue = (id, value, dataIndex) => {
    let path = id;
    if (dataIndex && Array.isArray(dataIndex)) {
      path = getDataPath(id, dataIndex);
    }
    onItemChange(path, value);
  };

  const endSubmitting = () =>
    setState({ isSubmitting: false, isValidating: false });

  const form = {
    // state
    formData,
    schema,
    flatten: _flatten,
    watchConfig,
    // methods
    onItemChange,
    setValue,
    getValues,
    resetFields,
    watch,
    submit,
    submitResult, // { formData 处理过了的formData, errorFields }
    isSubmitting,
    isValidating,
    endSubmitting,
  };
  return form;
};

function App({ widgets, mapping, form, onFinish, ...rest }) {
  const {
    flatten,
    submitResult,
    isSubmitting,
    isValidating,
    endSubmitting,
  } = form;
  // window.blog(flatten, form.formData);

  const store = {
    ...form,
    flatten,
    widgets: { ...defaultWidgets, ...widgets },
    mapping: { ...defaultMapping, ...mapping },
    ...rest,
  };

  useEffect(() => {
    if (!isValidating && isSubmitting) {
      Promise.resolve(onFinish(submitResult)).then(endSubmitting);
    }
  }, [isValidating, isSubmitting]);

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

export { createWidget } from './HOC';

export default App;
