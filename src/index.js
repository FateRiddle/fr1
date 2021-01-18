import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import FormRender, { useForm, createWidget } from './App';
import schema from './basic.json';
import Percent from './otherWidgets/Percent';

const delay = ms => new Promise(res => setTimeout(res, ms));

// const Demo = () => {
//   const form = useForm()
//   return <App form={form} schema={schema} />;
// };

const PercentWidget = createWidget(({ value, onChange }) => ({
  onPress: onChange,
  percent: value,
}))(Percent);

const Demo = () => {
  const [display, setDisplay] = useState({}); // TODO: 只是开发时候用

  const form = useForm({ schema });

  // const submit = () => {
  //   const formData = form.getValues();
  //   console.log(formData);
  // };

  const onFinish = ({ formData, errorFields }) => {
    console.log(formData, 'formData', errorFields, 'errors');
    setDisplay([formData, errorFields]);
  };

  const outsideValidation = () => {
    form.setErrorFields({ name: 'percentage', error: ['外部校验错误'] });
  };

  const beforeFinish = () => {
    return delay(0).then(_ =>
      form.setErrorFields({ name: 'percentage', error: ['外部校验错误'] })
    );
  };

  const watch = {
    'a.b.c': value => {
      form.onItemChange('a.b.d', value);
    },
    percentage: value => {
      form.onItemChange('a.b.c', String(value));
    },
  };

  // TODO: form 不传入，也可以用，至少可以展示
  return (
    <div>
      <button onClick={form.submit}>提交</button>
      <div style={{ height: 40 }}>{JSON.stringify(display[0])}</div>
      <div style={{ minHeight: 40 }}>{JSON.stringify(display[1])}</div>
      <div style={{ padding: 24 }}>
        <button onClick={outsideValidation}>外部校验传入</button>
        <FormRender
          watch={watch}
          form={form}
          beforeFinish={beforeFinish}
          onFinish={onFinish}
          widgets={{ percent: PercentWidget }}
          displayType="column"
        />
      </div>
    </div>
  );
};

ReactDOM.render(<Demo />, document.getElementById('root'));
