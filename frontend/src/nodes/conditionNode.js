// conditionNode.js — branches the pipeline on a boolean test.
// Demonstrates a node with multiple *outputs*.

import { BaseNode } from './BaseNode';

export const ConditionNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="logic"
    title="Condition"
    inputs={[{ id: `${id}-value`, label: 'value' }]}
    outputs={[
      { id: `${id}-true`, label: 'true' },
      { id: `${id}-false`, label: 'false' },
    ]}
    fields={[
      {
        key: 'test',
        label: 'If',
        type: 'text',
        default: 'value != null',
        placeholder: 'value != null',
      },
    ]}
  />
);
