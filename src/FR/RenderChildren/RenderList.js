import React, { useState, useEffect } from 'react';
import FR from '../index';
import { get } from 'lodash';
import { useStore } from '../../hooks';
import { getDataPath } from '../../utils';
import { Button, Table } from 'antd';

const RenderList = ({ parentId, dataIndex = [], children = [] }) => {
  const [displayList, setList] = useState([{}]); // 不带数据，只是个占位符
  const { formData, onItemChange, flatten } = useStore();
  let childrenSchema = {};
  try {
    childrenSchema = flatten[parentId].schema.items.properties;
  } catch (error) {
    console.error("can't find children schema");
  }
  const dataPath = getDataPath(parentId, dataIndex);
  let listData;
  if (typeof dataPath === 'string') {
    // TODO: listData会有不少“窟窿”，submit 的时候，listData也许需要补齐？
    listData = get(formData, dataPath);
  }

  // TODO: 需要放到 useEffect 里
  useEffect(() => {
    if (Array.isArray(listData) && listData.length > 0) {
      let newDisplayList = listData.map((item, index) => {
        return { index };
      });
      setList(newDisplayList);
    }
  }, []);

  const addItem = () => {
    setList([...displayList, {}]); // blows your mind, you don't need to actually create anything, just a visual thing
  };

  const deleteItem = idx => {
    console.log(idx, displayList);
    const remainList = displayList.filter((item, _idx) => _idx !== idx);
    setList(remainList);
    // remark: 删除时，不存在的item需要补齐，用null
    if (Array.isArray(listData)) {
      const realData = listData
        .map(item => {
          if (!item) {
            return null;
          } else {
            return item;
          }
        })
        .filter((item, _idx) => _idx !== idx);
      onItemChange(dataPath, realData);
    }
  };

  console.log('listData', listData);

  const displayProps = {
    displayList,
    dataIndex,
    children,
    deleteItem,
    addItem,
    listData,
    childrenSchema,
    flatten,
  };

  return <DemoList {...displayProps} />;
};

export default RenderList;

const DemoList = ({
  displayList = [{}],
  dataIndex,
  children,
  deleteItem,
  addItem,
  listData = [],
  childrenSchema,
  flatten,
}) => {
  const dataSource = displayList.map((item, idx) => {
    return { index: idx };
  });

  const columns = children.map(child => {
    const item = flatten[child];
    const schema = (item && item.schema) || {};
    return {
      dataIndex: child,
      title: schema.title,
      render: (value, record, index) => {
        const childIndex = [...dataIndex, index];
        return (
          <FR
            hideTitle={true}
            hideValidation={true}
            key={index.toString()}
            id={child}
            dataIndex={childIndex}
          />
        );
      },
    };
  });

  columns.push({
    title: '操作',
    key: '$action',
    render: record => {
      return <a onClick={() => deleteItem(record && record.index)}>Delete</a>;
    },
  });

  return (
    <>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="index"
        size="small"
      />
      <div className="w-100">
        <Button onClick={addItem}>addItem</Button>
      </div>
    </>
  );

  return (
    <ul className="flex flex-wrap pl0 list">
      {(displayList || []).map((item, idx) => {
        const childIndex = [...dataIndex, idx];
        return (
          <li key={idx.toString()} className={`w-100`}>
            {children.map((child, idx2) => {
              return (
                <FR key={idx2.toString()} id={child} dataIndex={childIndex} />
              );
            })}
            {Array.isArray(displayList) && displayList.length > 1 && (
              <Button onClick={() => deleteItem(idx)}>delete</Button>
            )}
          </li>
        );
      })}
      <div className="w-100">
        <Button onClick={addItem}>addItem</Button>
      </div>
    </ul>
  );
};

// TODO: 1. 展示有问题, 需要去具体算text的内容 2. 校验有问题，没有展开的项没有被校验到
const ExpandList = ({
  displayList = [{}],
  dataIndex,
  children,
  deleteItem,
  addItem,
  listData = [],
  childrenSchema,
}) => {
  const dataSource = displayList.map((item, idx) => {
    const data = listData[idx] || {};
    return { ...data, index: idx };
  });

  const columns = Object.keys(childrenSchema).map(key => {
    const item = childrenSchema[key];
    return {
      dataIndex: key,
      title: item.title,
      render: value => value || '-', // TODO: something
    };
  });

  columns.push({
    title: '操作',
    key: '$action',
    render: (record, idx) => {
      return <a onClick={() => deleteItem(idx)}>Delete</a>;
    },
  });

  return (
    <>
      <Table
        columns={columns}
        dataSource={dataSource}
        // defaultExpandAllRows
        rowKey="index"
        expandable={{
          expandedRowRender: (record, idx) => {
            const childIndex = [...dataIndex, idx];
            return (
              <li className={`w-100`}>
                {children.map((child, idx2) => {
                  return (
                    <FR
                      key={idx2.toString()}
                      id={child}
                      dataIndex={childIndex}
                    />
                  );
                })}
              </li>
            );
          },
        }}
      />
      <div className="w-100">
        <Button onClick={addItem}>addItem</Button>
      </div>
    </>
  );

  return (
    <ul className="flex flex-wrap pl0 list">
      {(displayList || []).map((item, idx) => {
        const childIndex = [...dataIndex, idx];
        return (
          <li key={idx.toString()} className={`w-100`}>
            {children.map((child, idx2) => {
              return (
                <FR key={idx2.toString()} id={child} dataIndex={childIndex} />
              );
            })}
            {Array.isArray(displayList) && displayList.length > 1 && (
              <Button onClick={() => deleteItem(idx)}>delete</Button>
            )}
          </li>
        );
      })}
      <div className="w-100">
        <Button onClick={addItem}>addItem</Button>
      </div>
    </ul>
  );
};
