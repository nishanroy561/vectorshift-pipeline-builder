// inputNode.js

import { BaseNode } from './BaseNode';

export const InputNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="source"
    title="Input"
    outputs={[{ id: `${id}-value`, label: 'value' }]}
    fields={[
      {
        key: 'inputName',
        label: 'Name',
        type: 'text',
        default: (nodeId) => nodeId.replace('customInput-', 'input_'),
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        default: '',
        placeholder: 'value to emit at runtime',
      },
    ]}
  />
);
