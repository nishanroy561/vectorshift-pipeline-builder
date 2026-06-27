// apiNode.js — fetches data from an external endpoint.

import { BaseNode } from './BaseNode';

export const ApiNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="source"
    title="API Request"
    inputs={[{ id: `${id}-trigger`, label: 'trigger' }]}
    outputs={[{ id: `${id}-response`, label: 'response' }]}
    fields={[
      {
        key: 'method',
        label: 'Method',
        type: 'select',
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        key: 'url',
        label: 'URL',
        type: 'text',
        default: 'https://api.example.com/v1',
        placeholder: 'https://…',
      },
    ]}
  />
);
