// vectorStoreNode.js — semantic retrieval (cosine similarity over embeddings).

import { BaseNode } from './BaseNode';
import { DocsField } from './docsField';

export const VectorStoreNode = ({ id, data }) => (
  <BaseNode
    id={id}
    data={data}
    category="data"
    title="Vector store"
    width={248}
    inputs={[{ id: `${id}-query`, label: 'query' }]}
    outputs={[{ id: `${id}-matches`, label: 'matches' }]}
  >
    <DocsField nodeId={id} />
  </BaseNode>
);
