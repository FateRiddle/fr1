import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import FormRender, { useForm } from './App';
import schema from './basic.json';

// const Demo = () => {
//   const form = useForm()
//   return <App form={form} schema={schema} />;
// };

const Demo = () => {
  const form = useForm();

  const submit = () => {
    const formData = form.getValues();
    console.log(formData);
  };

  return (
    <div>
      <button onClick={submit}>提交</button>
      <FormRender form={form} schema={schema} />
    </div>
  );
};

ReactDOM.render(<Demo />, document.getElementById('root'));
