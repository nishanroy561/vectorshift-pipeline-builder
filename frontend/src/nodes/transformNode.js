// transformNode.js — applies a Python expression to its input (`value`).
// The expression field has autocomplete (see ExprField).

import { BaseNode } from './BaseNode';
import { ExprField } from './exprField';

export const TransformNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="compute"
    title="Transform"
    inputs={[{ id: `${id}-value`, label: 'value' }]}
    outputs={[{ id: `${id}-result`, label: 'result' }]}
  >
    <ExprField
      nodeId={id}
      field={{ key: 'expr', label: 'Expression', default: 'str(value).upper()', rows: 2 }}
    />
  </BaseNode>
);
