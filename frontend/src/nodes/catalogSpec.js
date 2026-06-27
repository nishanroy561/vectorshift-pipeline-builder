// catalogSpec.js
// --------------------------------------------------
// Presentational spec for the Node Catalog gallery, ported from the
// "AI Pipeline Builder" design. Each entry's `type` matches a key in
// nodeTypes.js so a catalog card can drop a real node onto the canvas.
// `control` values map to the same field kinds fields.js renders.

export const CATALOG_SPEC = [
  {
    key: 'source',
    label: 'Source',
    nodes: [
      {
        type: 'customInput', title: 'Input', instanceId: 'input_1',
        desc: 'Emits a typed value into the workflow.',
        fields: [
          { label: 'Name', control: 'text', value: 'user_query' },
          { label: 'Type', control: 'select', value: 'Text' },
        ],
        outputs: ['value'],
      },
      {
        type: 'fileInput', title: 'File Upload', instanceId: 'file_upload_1',
        desc: 'Drag-drop a text file; emits its contents.',
        fields: [{ label: 'File', control: 'drop' }],
        outputs: ['content'],
      },
      {
        type: 'api', title: 'API Request', instanceId: 'api_request_1',
        desc: 'Calls an HTTP endpoint and returns the response.',
        fields: [
          { label: 'Method', control: 'select', value: 'GET' },
          { label: 'URL', control: 'text', value: 'https://api.acme.io/v1/items' },
        ],
        outputs: ['response'],
      },
    ],
  },
  {
    key: 'compute',
    label: 'Compute',
    nodes: [
      {
        type: 'llm', title: 'LLM', instanceId: 'llm_1',
        desc: 'Prompts a model with system, prompt and context.',
        fields: [
          { label: 'Provider', control: 'select', value: 'OpenAI' },
          { label: 'Model', control: 'select', value: 'gpt-4o' },
          { label: 'Temperature', control: 'number', value: '0.7' },
          { label: 'API Key', control: 'secret' },
        ],
        inputs: ['system', 'prompt', 'context'],
        outputs: ['response'],
      },
      {
        type: 'embedder', title: 'Embedder', instanceId: 'embedder_1',
        desc: 'Turns text into a numeric vector.',
        fields: [
          { label: 'Provider', control: 'select', value: 'OpenAI' },
          { label: 'Model', control: 'select', value: 'text-embedding-3-small' },
          { label: 'API Key', control: 'secret' },
        ],
        inputs: ['text'],
        outputs: ['embedding'],
      },
      {
        type: 'transform', title: 'Transform', instanceId: 'transform_1',
        desc: 'Applies a Python expression to the input.',
        fields: [{ label: 'Expression', control: 'text', value: 'value.strip().lower()' }],
        inputs: ['value'],
        outputs: ['result'],
      },
      {
        type: 'math', title: 'Math', instanceId: 'math_1',
        desc: 'Combines two numbers with an operation.',
        fields: [{ label: 'Operation', control: 'select', value: 'Add' }],
        inputs: ['a', 'b'],
        outputs: ['result'],
      },
    ],
  },
  {
    key: 'data',
    label: 'Data',
    nodes: [
      {
        type: 'text', title: 'Text', instanceId: 'text_1',
        desc: 'Composes text; {{ variables }} become input ports.',
        fields: [{ label: 'Template', control: 'area', value: 'Answer {{ query }} using only:\n{{ context }}' }],
        inputs: ['query', 'context'],
        outputs: ['output'],
      },
      {
        type: 'knowledgeBase', title: 'Knowledge Base', instanceId: 'knowledge_base_1',
        desc: 'Keyword retrieval over a document set.',
        fields: [
          { label: 'Documents', control: 'select', value: 'Company Docs' },
          { label: 'Top K', control: 'number', value: '5' },
        ],
        inputs: ['query'],
        outputs: ['context'],
      },
      {
        type: 'vectorStore', title: 'Vector Store', instanceId: 'vector_store_1',
        desc: 'Semantic retrieval over embedded documents.',
        fields: [
          { label: 'Documents', control: 'select', value: 'Product Wiki' },
          { label: 'Top K', control: 'number', value: '8' },
        ],
        inputs: ['query'],
        outputs: ['matches'],
      },
      {
        type: 'filter', title: 'Filter', instanceId: 'filter_1',
        desc: 'Keeps list items matching a predicate.',
        fields: [{ label: 'Predicate', control: 'text', value: 'item.score > 0.8' }],
        inputs: ['in'],
        outputs: ['out'],
      },
      {
        type: 'mongo', title: 'MongoDB', instanceId: 'mongodb_1',
        desc: 'Reads or writes a collection.',
        fields: [
          { label: 'URI', control: 'secret' },
          { label: 'Mode', control: 'select', value: 'Find' },
          { label: 'Query', control: 'text', value: "{ status: 'open' }" },
        ],
        inputs: ['record'],
        outputs: ['result'],
      },
    ],
  },
  {
    key: 'logic',
    label: 'Logic',
    nodes: [
      {
        type: 'condition', title: 'Condition', instanceId: 'condition_1',
        desc: 'Branches on a boolean test.',
        fields: [{ label: 'Test', control: 'text', value: 'value != null' }],
        inputs: ['value'],
        outputs: ['true', 'false'],
      },
      {
        type: 'loop', title: 'Loop', instanceId: 'loop_1',
        desc: 'Bounds a list to its first N items.',
        fields: [{ label: 'Limit', control: 'number', value: '10' }],
        inputs: ['items'],
        outputs: ['items', 'count'],
      },
      {
        type: 'merge', title: 'Merge', instanceId: 'merge_1',
        desc: 'Combines two inputs into one.',
        fields: [],
        inputs: ['a', 'b'],
        outputs: ['merged'],
      },
      {
        type: 'note', title: 'Note', noId: true, noPorts: true,
        desc: '',
        fields: [{ label: 'Note', control: 'area', value: 'Swap to the production API key before deploying this pipeline.' }],
      },
    ],
  },
  {
    key: 'sink',
    label: 'Sink',
    nodes: [
      {
        type: 'customOutput', title: 'Output', instanceId: 'output_1',
        desc: 'Exposes a named result from the run.',
        fields: [{ label: 'Name', control: 'text', value: 'result' }],
        inputs: ['value'],
      },
      {
        type: 'display', title: 'Display', instanceId: 'display_1',
        desc: 'A full-value inspector for debugging.',
        fields: [],
        inputs: ['value'],
        result: '{ ok: true, items: 42, took_ms: 318 }',
      },
    ],
  },
];

// Field control -> type-pill label (mirrors fields.js PILLS).
export const PILL_FOR_CONTROL = {
  text: 'Text',
  area: 'Text',
  number: 'Number',
  select: 'Dropdown',
  secret: 'Secret',
  drop: 'File',
};
