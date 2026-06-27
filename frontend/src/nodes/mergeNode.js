// mergeNode.js — combine two inputs into one (concat lists, merge dicts, join).

import { BaseNode } from './BaseNode';

export const MergeNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="logic"
    title="Merge"
    inputs={[
      { id: `${id}-a`, label: 'a' },
      { id: `${id}-b`, label: 'b' },
    ]}
    outputs={[{ id: `${id}-merged`, label: 'merged' }]}
  />
);
