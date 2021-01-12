import React, { useEffect } from 'react';
import { flattenSchema, getDataPath, isObject } from './utils';
import FR from './FR';
import { Ctx, StoreCtx, useSet } from './hooks';
import { widgets as defaultWidgets } from './widgets/antd';
import { mapping as defaultMapping } from './mapping';
import { set, unset } from 'lodash';
import 'tachyons';
import './index.css';

export const useForm = ({ schema, flatten }) => {
  const [state, setState] = useSet({
    formData: {}, // TODO: 初始值从外部传入
    watchConfig: {}, // 所有全局的watch，类似vue
    submitData: {},
    errorFields: [],
    isValidating: false,
    isSubmitting: false,
    _flatten: {},
    // statusTree: {}, // 目前就放 touched, 这个太多了，用errorFields的展示不合适，还是维持formData的展示
  });
  const {
    formData,
    watchConfig,
    submitData,
    errorFields,
    isValidating,
    isSubmitting,
    _flatten, // schema 在内部通用转换成 flatten，一般就一次转换。schema便于书写，flatten便于数据处理
    // statusTree, // 和formData一个结构，但是每个元素是 { $touched } 存放那些在schema里无需表达的状态, 看看是否只有touched。目前statusTree没有被使用
  } = state;

  useEffect(() => {
    setState({ _flatten: flatten || flattenSchema(schema) });
  }, [flatten, schema]);

  // const setTouched = (path, value) => {
  //   if (path === '#') return;
  // const cloneTree = JSON.parse(JSON.stringify(statusTree));
  //   const node = get(cloneTree, path);
  //   // value: false, true
  //   if (typeof path === 'string') {
  //     const newTree = set(cloneTree, path, { ...node, $touched: value });
  // setState({ statusTree: newTree });
  //   }
  // };

  // const getTouched = path => {
  //   if (typeof path === 'string') {
  //     if (typeof node.$touched === 'boolean') {
  //       return node.$touched;
  //     }
  //     return;
  //   }
  // };

  const onItemChange = (path, value) => {
    if (typeof path !== 'string') return;
    if (path === '#') {
      setState({ formData: value });
      return;
    }
    const newFormData = set(formData, path, value);
    setState({ formData: newFormData });
  };

  // TODO: 全局的没有path, 这个函数要这么写么。。全局的，可以path = #
  // errorFields: [
  //   { name: 'a.b.c', errors: ['Please input your Password!', 'something else is wrong'] },
  // ]
  // TODO：这个函数如果是异步的校验，咋办？是否要单独开异步校验的部分？还是放在一起
  const onItemValidate = (_path, value, rules) => {
    let path;
    if (typeof _path === 'string') {
      path = _path;
    } else if (Array.isArray(_path) && typeof _path[0] === 'string') {
      path = _path[0];
    } else {
      // 说明有传参有问题，直接结束 TODO: 后续可给个提示
      return;
    }
    let errorList = [];

    if (Array.isArray(rules) && rules.length > 0) {
      errorList = rules
        .map(rule => {
          const error = validateSingleRule(rule, value);
          if (error && typeof error === 'string') {
            return error;
          }
          return undefined;
        })
        .filter(item => !!item);
    }
    // if (errorList.length === 0) return; // 没有error，也要去更新

    const itemError = { name: path, error: errorList };
    // 这么写是有好多在同时进行，需要同时去触发和setState
    setState(({ errorFields }) => {
      let newErrorFields = [...errorFields];
      const sameItemIndex = errorFields.findIndex(item => item.name === path);
      if (sameItemIndex > -1) {
        newErrorFields[sameItemIndex] = itemError;
      } else {
        newErrorFields = [...newErrorFields, itemError];
      }
      // console.log('描述2', newErrorFields);
      const removeEmptyFields = newErrorFields.filter(item => {
        const emptyOne = Array.isArray(item.error) && item.error.length === 0;
        return !emptyOne;
      });

      return {
        errorFields: removeEmptyFields,
      };
    });
  };

  // TODO: 提取出来，重新写一份，注意要处理async
  const validateSingleRule = (rule, value) => {
    if (isObject(rule)) {
      if (rule.required === true) {
        if (value) return;
        return rule.message || `it is required`;
      }
      if (value === undefined || value === null) return;
      if (!Number.isNaN(Number(rule.min))) {
        if (value.length <= rule.min) return rule.message || '太短';
        return;
      }
      if (!Number.isNaN(Number(rule.max))) {
        if (value.length > rule.max) return rule.message || '太长';
        return;
      }
    }
  };

  const getValues = () => formData;

  const watch = watchConfig => setState({ watchConfig });

  const submit = () => {
    setState({ isValidating: true, isSubmitting: true });
    //  https://formik.org/docs/guides/form-submission
    // TODO: 更多的处理，注意处理的时候一定要是copy一份formData，否则submitData会和表单操作实时同步的。。而不是submit再变动了
    // start validating

    // const doValidation = (flatten, formData) => {
    //   let errorFields = [];
    //   Object.keys(flatten).forEach(id => {});
    // };

    const processData = data => {
      let _data = JSON.parse(JSON.stringify(data));
      // 1. bind = false 的处理
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
            // const keys = key.split('[]').filter(k => !!k);
            // TODO: 贼复杂，之后写吧
          }
        });
      };
      removeUnbindData(_data);

      // 2. 其他处理

      return _data;
    };

    Promise.resolve(processData(formData)).then(res => {
      setState({
        isValidating: false,
        submitData: res,
      });
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
    submitData,
    errorFields,
    isSubmitting,
    isValidating,
    endSubmitting,
    onItemValidate,
  };
  return form;
};

function App({ widgets, mapping, form, onFinish, displayType, ...rest }) {
  const {
    flatten,
    submitData,
    errorFields,
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
    displayType: displayType || 'row',
    ...rest,
  };

  useEffect(() => {
    if (!isValidating && isSubmitting) {
      Promise.resolve(onFinish({ formData: submitData, errorFields })).then(
        endSubmitting
      );
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
