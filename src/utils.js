import deepClone from 'clone';
import { get } from 'lodash';

// 后面三个参数都是内部递归使用的，将schema的树形结构扁平化成一层, 每个item的结构
// {
//   parent: '#',
//   schema: ...,
//   children: []
// }

window.blog = value => {
  console.log('%ccommon:', 'color: #00A7F7; font-weight: 500;', value);
};

window.rlog = value => {
  console.log('%cwarning:', 'color: #f50; font-weight: 500;', value);
};

window.glog = value => {
  console.log('%csuccess:', 'color: #87d068; font-weight: 500;', value);
};

window.plog = value => {
  console.log('%cspecial:', 'color: #722ed1; font-weight: 500;', value);
};

export function isCheckBoxType(schema) {
  return (
    schema && schema.type === 'boolean' && schema['ui:widget'] !== 'switch'
  ); // TODO: 感觉有点不准
}

function removeBrackets(string) {
  if (typeof string === 'string') {
    return string.replace(/\[\]/g, '');
  } else {
    return string;
  }
}

export function getParentPath(path) {
  if (typeof path === 'string') {
    const pathArr = path.split('.');
    if (pathArr.length === 1) {
      return '#';
    }
    pathArr.pop();
    return pathArr.join('.');
  }
  return '#';
}

export function getValueByPath(formData, path) {
  if (path === '#') {
    return formData;
  } else if (typeof path === 'string') {
    return get(formData, path);
  }
}

//  path: 'a.b[1].c[0]' => { id: 'a.b[].c[]'  dataIndex: [1,0] }
export function destructDataPath(path) {
  let id;
  let dataIndex;
  if (path === '#') {
    return { id: '#', dataIndex: [] };
  }
  if (typeof path !== 'string') {
    throw Error(`path ${path} is not a string!!! Something wrong here`);
  }
  const pattern = /\[[0-9]+\]/g;
  const matchList = path.match(pattern);
  if (!matchList) {
    id = path;
  } else {
    id = path.replace(pattern, '[]');
    // 这个是match下来的结果，可安全处理
    dataIndex = matchList.map(item =>
      Number(item.substring(1, item.length - 1))
    );
  }
  return { id, dataIndex };
}

// id: 'a.b[].c[]'  dataIndex: [1,0] =>  'a.b[1].c[0]'
export function getDataPath(id, dataIndex) {
  if (id === '#') {
    return id;
  }
  if (typeof id !== 'string') {
    throw Error(`id ${id} is not a string!!! Something wrong here`);
  }
  let _id = id;
  if (Array.isArray(dataIndex)) {
    // const matches = id.match(/\[\]/g) || [];
    // const count = matches.length;
    dataIndex.forEach(item => {
      _id = _id.replace(/\[\]/, `[${item}]`);
    });
  }
  return removeBrackets(_id);
}

export function isListType(schema) {
  return schema.type === 'array' && schema.items && schema.enum === undefined;
}

export function isObjType(schema) {
  return schema.type === 'object' && schema.properties;
}

// TODO: 检验是否丢进去各种schema都能兜底不会crash
export function flattenSchema(_schema = {}, name = '#', parent, result = {}) {
  const schema = deepClone(_schema); // TODO: 是否需要deepClone，这个花费是不是有点大
  let _name = name;
  if (!schema.$id) {
    schema.$id = _name; // 给生成的schema添加一个唯一标识，方便从schema中直接读取
  }
  const children = [];
  if (isObjType(schema)) {
    Object.entries(schema.properties).forEach(([key, value]) => {
      const _key = isListType(value) ? key + '[]' : key;
      const uniqueName = _name === '#' ? _key : _name + '.' + _key;
      children.push(uniqueName);
      flattenSchema(value, uniqueName, _name, result);
    });
    schema.properties = {};
  }
  if (isListType(schema)) {
    Object.entries(schema.items.properties).forEach(([key, value]) => {
      const _key = isListType(value) ? key + '[]' : key;
      const uniqueName = _name === '#' ? _key : _name + '.' + _key;
      children.push(uniqueName);
      flattenSchema(value, uniqueName, _name, result);
    });
    schema.items.properties = {};
  }

  const rules = Array.isArray(schema.rules) ? [...schema.rules] : [];
  if (schema.required === true) {
    rules.push({ required: true }); // TODO: 万一内部已经用重复的required规则？
  }

  if (schema.type) {
    // Check: 为啥一定要有type？
    // TODO: 没有想好 validation 的部分
    result[_name] = { parent, schema: schema, children, rules };
  }
  return result;
}

//////////   old

function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

export const isObject = a =>
  stringContains(Object.prototype.toString.call(a), 'Object');

// 克隆对象
export function clone(data) {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    return data;
  }
}

// '3' => true, 3 => true, undefined => false
export function isLooselyNumber(num) {
  if (typeof num === 'number') return true;
  if (typeof num === 'string') {
    return !Number.isNaN(Number(num));
  }
  return false;
}

export function isCssLength(str) {
  if (typeof str !== 'string') return false;
  return str.match(/^([0-9])*(%|px|rem|em)$/i);
}

// 深度对比
export function isDeepEqual(param1, param2) {
  if (param1 === undefined && param2 === undefined) return true;
  else if (param1 === undefined || param2 === undefined) return false;
  if (param1 === null && param2 === null) return true;
  else if (param1 === null || param2 === null) return false;
  else if (param1.constructor !== param2.constructor) return false;

  if (param1.constructor === Array) {
    if (param1.length !== param2.length) return false;
    for (let i = 0; i < param1.length; i++) {
      if (param1[i].constructor === Array || param1[i].constructor === Object) {
        if (!isDeepEqual(param1[i], param2[i])) return false;
      } else if (param1[i] !== param2[i]) return false;
    }
  } else if (param1.constructor === Object) {
    if (Object.keys(param1).length !== Object.keys(param2).length) return false;
    for (let i = 0; i < Object.keys(param1).length; i++) {
      const key = Object.keys(param1)[i];
      if (
        param1[key] &&
        typeof param1[key] !== 'number' &&
        (param1[key].constructor === Array ||
          param1[key].constructor === Object)
      ) {
        if (!isDeepEqual(param1[key], param2[key])) return false;
      } else if (param1[key] !== param2[key]) return false;
    }
  } else if (param1.constructor === String || param1.constructor === Number) {
    return param1 === param2;
  }
  return true;
}

// 时间组件
export function getFormat(format) {
  let dateFormat;
  switch (format) {
    case 'date':
      dateFormat = 'YYYY-MM-DD';
      break;
    case 'time':
      dateFormat = 'HH:mm:ss';
      break;
    default:
      // dateTime
      dateFormat = 'YYYY-MM-DD HH:mm:ss';
  }
  return dateFormat;
}

export function hasRepeat(list) {
  return list.find(
    (x, i, self) =>
      i !== self.findIndex(y => JSON.stringify(x) === JSON.stringify(y))
  );
}

// ----------------- schema 相关

// 合并propsSchema和UISchema。由于两者的逻辑相关性，合并为一个大schema能简化内部处理
export function combineSchema(propsSchema = {}, uiSchema = {}) {
  const propList = getChildren(propsSchema);
  const newList = propList.map(p => {
    const { name } = p;
    const { type, enum: options, properties, items } = p.schema;
    const isObj = type === 'object' && properties;
    const isArr = type === 'array' && items && !options; // enum + array 代表的多选框，没有sub
    const ui = name && uiSchema[p.name];
    if (!ui) {
      return p;
    }
    // 如果是list，递归合并items
    if (isArr) {
      const newItems = combineSchema(items, ui.items || {});
      return { ...p, schema: { ...p.schema, ...ui, items: newItems } };
    }
    // object递归合并整个schema
    if (isObj) {
      const newSchema = combineSchema(p.schema, ui);
      return { ...p, schema: newSchema };
    }
    return { ...p, schema: { ...p.schema, ...ui } };
  });

  const newObj = {};
  newList.forEach(s => {
    newObj[s.name] = s.schema;
  });

  const topLevelUi = {};
  Object.keys(uiSchema).forEach(key => {
    if (typeof key === 'string' && key.substring(0, 3) === 'ui:') {
      topLevelUi[key] = uiSchema[key];
    }
  });
  if (isEmpty(newObj)) {
    return { ...propsSchema, ...topLevelUi };
  }
  return { ...propsSchema, ...topLevelUi, properties: newObj };
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// 获得propsSchema的children
function getChildren(schema) {
  if (!schema) return [];
  const {
    // object
    properties,
    // array
    items,
    type,
  } = schema;
  if (!properties && !items) {
    return [];
  }
  let schemaSubs = {};
  if (type === 'object') {
    schemaSubs = properties;
  }
  if (type === 'array') {
    schemaSubs = items;
  }
  return Object.keys(schemaSubs).map(name => ({
    schema: schemaSubs[name],
    name,
  }));
}

// 合并多个schema树，比如一个schema的树节点是另一个schema
export function combine() {}

// 代替eval的函数
export const parseString = string =>
  Function('"use strict";return (' + string + ')')();

// 解析函数字符串值
export const evaluateString = (string, formData, rootValue) =>
  Function(`"use strict";
    const rootValue = ${JSON.stringify(rootValue)};
    const formData = ${JSON.stringify(formData)};
    return (${string})`)();

// 判断schema的值是是否是“函数”
// JSON无法使用函数值的参数，所以使用"{{...}}"来标记为函数，也可使用@标记，不推荐。
export function isExpression(func) {
  if (typeof func === 'function') {
    const funcString = func.toString();
    return (
      funcString.indexOf('formData') > -1
      // || funcString.indexOf('rootValue') > -1 // Check: 这个旧版兼容，值得么
    );
  }
  // 这样的pattern {{.....}}
  const pattern = /^({{){1}.+(}}){1}$/g;
  if (typeof func === 'string' && func.match(pattern)) {
    return true;
    // return func.substring(2, func.length - 2);
  }
  return false;
}

// TODO: dataPath 是 array 的情况？
export function parseSingleExpression(func, formData, _dataPath) {
  let dataPath = _dataPath;
  if (Array.isArray(_dataPath)) {
    dataPath = _dataPath[0]; // Check: 就不要去支持array的情况下去使用rootValue，逻辑上就是不通的, 这里取第一个值的，是默认所有值的parent都一样。
  }
  const parentPath = getParentPath(dataPath);
  const parent = getValueByPath(formData, parentPath);
  if (typeof func === 'function') {
    try {
      return func(formData, parent);
    } catch (e) {
      console.error(`${dataPath}表达式解析错误`);
      return;
    }
  } else if (typeof func === 'string') {
    const parser = match => {
      const path = match.replace('formData.', '');
      const result = get(formData, path);
      return result;
    };
    const parser2 = match => {
      const replaceValue = parentPath === '#' ? '' : parentPath + '.';
      const path = match.replace('rootValue.', replaceValue);
      const result = get(formData, path);
      return result;
    };
    const funcBody = func.substring(2, func.length - 2);
    const match1 = /(formData\.){1}[a-zA-Z0-9.$_\[\]]+/;
    const match2 = /(rootValue\.){1}[a-zA-Z0-9.$_\[\]]+/; // 这里叫rootValue是为了兼容旧的
    const str = `"use strict";
    var formData = ${JSON.stringify(formData)};
    var rootValue = ${JSON.stringify(parent)};
    return (${funcBody
      .replace(match1, v => JSON.stringify(parser(v)))
      .replace(match2, v => JSON.stringify(parser2(v)))})`;
    const e = Function(str)();
    console.log('expression', str, e);
    return Function(str)();
  } else return undefined;
}

export const schemaContainsExpression = schema => {
  return Object.keys(schema).some(key => {
    const value = schema[key];
    if (['string', 'function'].indexOf(typeof value) > -1) {
      return isExpression(value);
    } else if (isObject(value)) {
      return schemaContainsExpression(value);
    }
    return false;
  });
};

export const parseAllExpression = (_schema, formData, dataPath) => {
  const schema = clone(_schema);
  Object.keys(schema).forEach(key => {
    const value = schema[key];
    if (['string', 'function'].indexOf(typeof value) > -1) {
      if (isExpression(value)) {
        schema[key] = parseSingleExpression(value, formData, dataPath);
      }
    }
  });
  return schema;
};

// 判断schema中是否有属性值是函数表达式
export function isFunctionSchema(schema) {
  return Object.keys(schema).some(key => {
    if (typeof schema[key] === 'function') {
      return true;
    } else if (typeof schema[key] === 'string') {
      return isExpression(schema[key]);
    } else if (typeof schema[key] === 'object') {
      return isFunctionSchema(schema[key]);
    } else {
      return false;
    }
  });
}

// 例如当前item的id = '#/obj/input'  propName: 'ui:labelWidth' 往上一直找，直到找到第一个不是undefined的值 TODO: 看看是否ok
export const getParentProps = (propName, id, flatten) => {
  try {
    const item = flatten[id];
    if (item.schema[propName] !== undefined) return item.schema[propName];
    if (item && item.parent) {
      const parentSchema = flatten[item.parent].schema;
      if (parentSchema[propName] !== undefined) {
        return parentSchema[propName];
      } else {
        return getParentProps(propName, item.parent, flatten);
      }
    }
  } catch (error) {
    return undefined;
  }
};

export const getSaveNumber = () => {
  const searchStr = localStorage.getItem('SAVES');
  if (searchStr) {
    try {
      const saves = JSON.parse(searchStr);
      const length = saves.length;
      if (length) return length + 1;
    } catch (error) {
      return 1;
    }
  } else {
    return 1;
  }
};

export function looseJsonParse(obj) {
  return Function('"use strict";return (' + obj + ')')();
}

// 获得propsSchema的children
function getChildren2(schema) {
  if (!schema) return [];
  const {
    // object
    properties,
    // array
    items,
    type,
  } = schema;
  if (!properties && !items) {
    return [];
  }
  let schemaSubs = {};
  if (type === 'object') {
    schemaSubs = properties;
  }
  if (type === 'array') {
    schemaSubs = items.properties;
  }
  return Object.keys(schemaSubs).map(name => ({
    schema: schemaSubs[name],
    name,
  }));
}

export const oldSchemaToNew = schema => {
  if (schema && schema.propsSchema) {
    const { propsSchema, ...rest } = schema;
    return { schema: propsSchema, ...rest };
  }
  return schema;
};

export const newSchemaToOld = setting => {
  if (setting && setting.schema) {
    const { schema, ...rest } = setting;
    return { propsSchema: schema, ...rest };
  }
  return setting;
};

// from FR

export const getEnum = schema => {
  if (!schema) return undefined;
  const itemEnum = schema && schema.items && schema.items.enum;
  const schemaEnum = schema && schema.enum;
  return itemEnum ? itemEnum : schemaEnum;
};

export const getArray = (arr, defaultValue = []) => {
  if (Array.isArray(arr)) return arr;
  return defaultValue;
};

export const isEmail = value => {
  const regex = '^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)+$';
  if (value && new RegExp(regex).test(value)) {
    return true;
  }
  return false;
};

export function defaultGetValueFromEvent(valuePropName, ...args) {
  const event = args[0];
  if (event && event.target && valuePropName in event.target) {
    return event.target[valuePropName];
  }
  return event;
}
