// knowledgeBaseNode.js — lexical (keyword-overlap) retrieval over documents.

import { BaseNode } from './BaseNode';
import { DocsField } from './docsField';

export const KnowledgeBaseNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="data"
    title="Knowledge base"
    width={248}
    inputs={[{ id: `${id}-query`, label: 'query' }]}
    outputs={[{ id: `${id}-context`, label: 'context' }]}
  >
    <DocsField nodeId={id} />
  </BaseNode>
);
