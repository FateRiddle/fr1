import React, { useEffect } from 'react';
import { flattenSchema, getDataPath } from './utils';
import FR from './FR';
import { Ctx, StoreCtx, useSet } from './hooks';
import { widgets as defaultWidgets } from './widgets/antd';
import { mapping as defaultMapping } from './mapping';
import { set } from 'lodash';
// import './atom.css';

export const useForm = schema => {
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
    const processData = data => JSON.parse(JSON.stringify(data));
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

function App({ flatten, widgets, mapping, form, onFinish, ...rest }) {
  const {
    schema,
    submitResult,
    isSubmitting,
    isValidating,
    endSubmitting,
  } = form;
  const _flatten = flatten || flattenSchema(schema);
  // window.blog(_flatten, form.formData);

  const store = {
    ...form,
    flatten: _flatten,
    widgets: { ...defaultWidgets, ...widgets },
    mapping: { ...defaultMapping, ...mapping },
    ...rest,
  };

  useEffect(() => {
    if (!isValidating && isSubmitting) {
      console.log(submitResult, 'submitresult');
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
