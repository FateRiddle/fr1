import React from 'react';
import FR from '../index';
import { get } from 'lodash';
import { useStore } from '../../hooks';
import { getDataPath } from '../../utils';
import { Button, Table } from 'antd';

const FIELD_LENGTH = 200;

const RenderList = ({ parentId, dataIndex = [], children = [] }) => {
  const { formData, onItemChange, removeValidation, flatten } = useStore();

  // 计算 list对应的formData
  const dataPath = getDataPath(parentId, dataIndex);
  let listData;
  if (typeof dataPath === 'string') {
    // TODO: listData会有不少“窟窿”，submit 的时候，listData 需要补齐 or filter
    listData = get(formData, dataPath);
  }

  const displayList = Array.isArray(listData) ? listData : [undefined];

  const addItem = () => {
    const newList = [...displayList, undefined];
    onItemChange(dataPath, newList);
  };

  const deleteItem = idx => {
    // TODO: 删除元素的时候，也需要delete相对于的校验信息（errorFields）
    // remark: 删除时，不存在的item需要补齐，用null
    const newList = displayList.filter((item, kdx) => kdx !== idx);
    onItemChange(dataPath, newList);
    // const itemPath = dataPath + `[${idx}]`; //TODO: 这块有问题啊，idx好像不准
    removeValidation(dataPath);
  };

  const displayProps = {
    displayList,
    dataIndex,
    children,
    deleteItem,
    addItem,
    listData,
    flatten,
  };

  return <TableList {...displayProps} />;
};

export default RenderList;

const TableList = ({
  displayList = [{}],
  dataIndex,
  children,
  deleteItem,
  addItem,
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
      width: FIELD_LENGTH,
      render: (value, record, index) => {
        // Check: record.index 似乎是antd自己会给的，不错哦
        const childIndex = [...dataIndex, record.index];
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
    fixed: 'right',
    width: 120,
    render: (value, record, index) => {
      return <a onClick={() => deleteItem(index)}>删除</a>;
    },
  });

  return (
    <>
      <div className="w-100 mb2 tr">
        <Button type="primary" size="small" onClick={addItem}>
          新增
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="index"
        size="small"
        scroll={{ x: children.length * FIELD_LENGTH }}
        pagination={{ size: 'small', hideOnSinglePage: true }}
      />
    </>
  );
};

// TODO: 1. 展示有问题, 需要去具体算text的内容 2. 校验有问题，没有展开的项没有被校验到
// const ExpandList = ({
//   displayList = [{}],
//   dataIndex,
//   children,
//   deleteItem,
//   addItem,
//   listData = [],
//   childrenSchema,
// }) => {
//   const dataSource = displayList.map((item, idx) => {
//     const data = listData[idx] || {};
//     return { ...data, index: idx };
//   });

//   const columns = Object.keys(childrenSchema).map(key => {
//     const item = childrenSchema[key];
//     return {
//       dataIndex: key,
//       title: item.title,
//       render: value => value || '-', // TODO: something
//     };
//   });

//   columns.push({
//     title: '操作',
//     key: '$action',
//     render: (record, idx) => {
//       return <a onClick={() => deleteItem(idx)}>Delete</a>;
//     },
//   });

//   return (
//     <>
//       <Table
//         columns={columns}
//         dataSource={dataSource}
//         // defaultExpandAllRows
//         rowKey="index"
//         expandable={{
//           expandedRowRender: (record, idx) => {
//             const childIndex = [...dataIndex, idx];
//             return (
//               <li className={`w-100`}>
//                 {children.map((child, idx2) => {
//                   return (
//                     <FR
//                       key={idx2.toString()}
//                       id={child}
//                       dataIndex={childIndex}
//                     />
//                   );
//                 })}
//               </li>
//             );
//           },
//         }}
//       />
//       <div className="w-100">
//         <Button onClick={addItem}>addItem</Button>
//       </div>
//     </>
//   );

//   return (
//     <ul className="flex flex-wrap pl0 list">
//       {(displayList || []).map((item, idx) => {
//         const childIndex = [...dataIndex, idx];
//         return (
//           <li key={idx.toString()} className={`w-100`}>
//             {children.map((child, idx2) => {
//               return (
//                 <FR key={idx2.toString()} id={child} dataIndex={childIndex} />
//               );
//             })}
//             {Array.isArray(displayList) && displayList.length > 1 && (
//               <Button onClick={() => deleteItem(idx)}>delete</Button>
//             )}
//           </li>
//         );
//       })}
//       <div className="w-100">
//         <Button onClick={addItem}>addItem</Button>
//       </div>
//     </ul>
//   );
// };
