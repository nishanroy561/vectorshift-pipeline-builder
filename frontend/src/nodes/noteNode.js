// noteNode.js — a free-text annotation. Demonstrates a node with *no* ports.

import { BaseNode } from './BaseNode';

export const NoteNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="logic"
    title="Note"
    width={240}
    fields={[
      {
        key: 'note',
        label: '',
        type: 'textarea',
        rows: 3,
        default: '',
        placeholder: 'Leave a note for your team…',
      },
    ]}
  />
);
