// mongoNode.js — read from or write to MongoDB (via the backend's motor driver).

import { BaseNode } from './BaseNode';

export const MongoNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="data"
    title="MongoDB"
    width={244}
    inputs={[{ id: `${id}-record`, label: 'record' }]}
    outputs={[{ id: `${id}-result`, label: 'result' }]}
    fields={[
      { key: 'uri', label: 'Connection URI', type: 'password', placeholder: 'mongodb+srv://…' },
      { key: 'mode', label: 'Mode', type: 'select', default: 'find', options: [
        { value: 'find', label: 'Find' },
        { value: 'insertOne', label: 'Insert one' },
        { value: 'updateOne', label: 'Update one' },
        { value: 'upsert', label: 'Upsert (find or insert)' },
        { value: 'deleteOne', label: 'Delete one' },
      ] },
      { key: 'database', label: 'Database', type: 'text', default: 'test' },
      { key: 'collection', label: 'Collection', type: 'text', default: 'documents' },
      { key: 'limit', label: 'Limit', type: 'number', default: 5 },
      { key: 'query', label: 'Query (JSON)', type: 'textarea', rows: 2, default: '{}' },
    ]}
  />
);
