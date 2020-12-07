import React from 'react';
import { Button } from 'antd';
import { flattenSchema } from './utils';

function App({ schema }) {
  console.log(flattenSchema(schema));
  return <div className="App">hhaha</div>;
}

export default App;
