import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import FormRender, { useForm, createWidget } from './App';
import schema from './basic.json';
import Percent from './otherWidgets/Percent';

// const Demo = () => {
//   const form = useForm()
//   return <App form={form} schema={schema} />;
// };

const PercentWidget = createWidget(({ value, onChange }) => ({
  onPress: onChange,
  percent: value,
}))(Percent);

const Demo = () => {
  const [display, setDisplay] = useState({});

  const form = useForm(schema);

  // const submit = () => {
  //   const formData = form.getValues();
  //   console.log(formData);
  // };

  const onFinish = ({ formData }) => {
    console.log(formData, 'formData');
    setDisplay(formData);
  };

  // TODO: form 不传入，也可以用，至少可以展示
  return (
    <div>
      <button onClick={form.submit}>提交</button>
      <div>{JSON.stringify(display)}</div>
      <FormRender
        form={form}
        onFinish={onFinish}
        widgets={{ percent: PercentWidget }}
      />
    </div>
  );
};

ReactDOM.render(<Demo />, document.getElementById('root'));
