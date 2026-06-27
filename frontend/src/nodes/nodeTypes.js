// nodeTypes.js
// --------------------------------------------------
// Maps each catalog type to its component. This is the only place that knows
// about the concrete node components, and it's what ReactFlow consumes.

import { InputNode } from './inputNode';
import { OutputNode } from './outputNode';
import { LLMNode } from './llmNode';
import { TextNode } from './textNode';
import { FilterNode } from './filterNode';
import { MathNode } from './mathNode';
import { ApiNode } from './apiNode';
import { ConditionNode } from './conditionNode';
import { NoteNode } from './noteNode';
import { FileUploadNode } from './fileUploadNode';
import { EmbedderNode } from './embedderNode';
import { TransformNode } from './transformNode';
import { DisplayNode } from './displayNode';
import { KnowledgeBaseNode } from './knowledgeBaseNode';
import { VectorStoreNode } from './vectorStoreNode';
import { MongoNode } from './mongoNode';
import { LoopNode } from './loopNode';
import { MergeNode } from './mergeNode';

export const nodeTypes = {
  // Wireframe roster
  customInput: InputNode,
  fileInput: FileUploadNode,
  llm: LLMNode,
  embedder: EmbedderNode,
  transform: TransformNode,
  customOutput: OutputNode,
  display: DisplayNode,
  text: TextNode,
  knowledgeBase: KnowledgeBaseNode,
  vectorStore: VectorStoreNode,
  mongo: MongoNode,
  condition: ConditionNode,
  loop: LoopNode,
  merge: MergeNode,
  // Still renderable (not in the parts bin) for older saved pipelines
  filter: FilterNode,
  math: MathNode,
  api: ApiNode,
  note: NoteNode,
};
