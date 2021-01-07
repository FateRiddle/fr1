import React, { useState, useEffect } from 'react';
import FR from './index';
import { get } from 'lodash';
import { useStore } from '../hooks';
import { getDataPath } from '../utils';
import { Button } from 'antd';

// TODO: nanoId 好像没啥用
export const RenderObject = ({ children = [], dataIndex = [] }) => {
  return (
    <>
      {children.map((child, i) => {
        const FRProps = {
          id: child,
          dataIndex,
        };
        return <FR key={i.toString()} {...FRProps} />;
      })}
    </>
  );
};

export const RenderList = ({ parentId, dataIndex = [], children = [] }) => {
  const [displayList, setList] = useState([{}]); // 不带数据，只是个占位符
  const { formData, onItemChange } = useStore();
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

  return (
    <>
      {(displayList || []).map((item, idx) => {
        const childIndex = [...dataIndex, idx];
        return (
          <li key={idx.toString()} className={`flex flex-wrap pl0`}>
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
      <Button onClick={addItem}>addItem</Button>
    </>
  );
};
