// loopNode.js — bound an upstream list to a maximum number of items.

import { BaseNode } from './BaseNode';

export const LoopNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="logic"
    title="Loop"
    inputs={[{ id: `${id}-in`, label: 'items' }]}
    outputs={[
      { id: `${id}-items`, label: 'items' },
      { id: `${id}-count`, label: 'count' },
    ]}
    fields={[
      { key: 'limit', label: 'Max iterations', type: 'number', default: 10 },
    ]}
  />
);
