// mathNode.js — combines two numeric inputs.

import { BaseNode } from './BaseNode';

export const MathNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="compute"
    title="Math"
    inputs={[
      { id: `${id}-a`, label: 'a' },
      { id: `${id}-b`, label: 'b' },
    ]}
    outputs={[{ id: `${id}-result`, label: 'result' }]}
    fields={[
      {
        key: 'operation',
        label: 'Operation',
        type: 'select',
        default: 'add',
        options: [
          { value: 'add', label: 'a + b' },
          { value: 'subtract', label: 'a − b' },
          { value: 'multiply', label: 'a × b' },
          { value: 'divide', label: 'a ÷ b' },
        ],
      },
    ]}
  />
);
