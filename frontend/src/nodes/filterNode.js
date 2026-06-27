// filterNode.js — keeps only items matching a predicate.

import { BaseNode } from './BaseNode';

export const FilterNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="data"
    title="Filter"
    inputs={[{ id: `${id}-in`, label: 'in' }]}
    outputs={[{ id: `${id}-out`, label: 'out' }]}
    fields={[
      {
        key: 'predicate',
        label: 'Keep where',
        type: 'text',
        default: 'item.score > 0.5',
        placeholder: 'item.score > 0.5',
      },
    ]}
  />
);
