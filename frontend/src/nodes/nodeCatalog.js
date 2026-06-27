// nodeCatalog.js
// --------------------------------------------------
// Single source of truth for which node types exist, how they're labeled in
// the parts bin, their category (accent), and their reference-designator
// prefix (the schematic tag shown as e.g. "U1", "IN2"). Kept free of any
// component imports so the store and sidebar can read it without cycles.

export const NODE_CATALOG = [
  { type: 'customInput',   label: 'Input',          category: 'source',  refdes: 'IN',   icon: '→'  },
  { type: 'fileInput',     label: 'File upload',    category: 'source',  refdes: 'FILE', icon: '⬆'  },
  { type: 'api',           label: 'API Request',    category: 'source',  refdes: 'API',  icon: '⇄'  },
  { type: 'llm',           label: 'LLM',            category: 'compute', refdes: 'U',    icon: '✦'  },
  { type: 'embedder',      label: 'Embedder',       category: 'compute', refdes: 'EMB',  icon: '≋'  },
  { type: 'transform',     label: 'Transform',      category: 'compute', refdes: 'FN',   icon: 'ƒ'  },
  { type: 'math',          label: 'Math',           category: 'compute', refdes: 'MTH',  icon: '∑'  },
  { type: 'customOutput',  label: 'Output',         category: 'sink',    refdes: 'OUT',  icon: '←'  },
  { type: 'display',       label: 'Display',        category: 'sink',    refdes: 'DSP',  icon: '⊡'  },
  { type: 'text',          label: 'Text',           category: 'data',    refdes: 'TXT',  icon: 'T'  },
  { type: 'knowledgeBase', label: 'Knowledge base', category: 'data',    refdes: 'KB',   icon: '▤'  },
  { type: 'vectorStore',   label: 'Vector store',   category: 'data',    refdes: 'VEC',  icon: '◎'  },
  { type: 'filter',        label: 'Filter',         category: 'data',    refdes: 'FLT',  icon: '▽'  },
  { type: 'mongo',         label: 'MongoDB',        category: 'data',    refdes: 'MDB',  icon: '⛁'  },
  { type: 'condition',     label: 'Condition',      category: 'logic',   refdes: 'IF',   icon: '◈'  },
  { type: 'loop',          label: 'Loop',           category: 'logic',   refdes: 'LOOP', icon: '↻'  },
  { type: 'merge',         label: 'Merge',          category: 'logic',   refdes: 'MRG',  icon: '⋈'  },
  { type: 'note',          label: 'Note',           category: 'logic',   refdes: 'NOTE', icon: '✎'  },
];

// One-line "what this node does" blurbs, shown under each node's title.
export const NODE_DESCRIPTIONS = {
  customInput: 'Pass data of different types into your workflow.',
  fileInput: 'Read a text file and emit its contents.',
  api: 'Call an external HTTP endpoint and return the response.',
  llm: 'Prompt a large language model and return its response.',
  embedder: 'Turn text into a vector embedding.',
  transform: 'Apply a Python expression to the input value.',
  math: 'Combine two numbers with an arithmetic operation.',
  customOutput: 'Expose a named result from your workflow.',
  display: 'Inspect any value with a full, formatted view.',
  text: 'Compose text and inject {{ variables }} from inputs.',
  knowledgeBase: 'Query documents by keyword overlap and return the best matches.',
  vectorStore: 'Query documents by semantic similarity and return the closest matches.',
  filter: 'Keep only the list items that match a predicate.',
  mongo: 'Read from or write to a MongoDB collection.',
  condition: 'Branch the flow on a boolean test.',
  loop: 'Bound a list to a maximum number of items.',
  merge: 'Combine two inputs into one.',
  note: 'A free-text annotation for your canvas.',
};

const byType = (type) => NODE_CATALOG.find((n) => n.type === type);

export const categoryForType = (type) => byType(type)?.category || 'data';

// Resolve a node's catalog entry (label, icon, category, description) from its id.
export const nodeInfoForId = (id = '') => {
  const lastDash = id.lastIndexOf('-');
  const type = lastDash === -1 ? id : id.slice(0, lastDash);
  const entry = byType(type);
  if (!entry) return null;
  return { ...entry, desc: NODE_DESCRIPTIONS[type] || '' };
};

// Build a schematic refdes from a node id ("llm-3" -> "U3").
export const refdesForId = (id = '') => {
  const lastDash = id.lastIndexOf('-');
  const type = lastDash === -1 ? id : id.slice(0, lastDash);
  const num = lastDash === -1 ? '' : id.slice(lastDash + 1);
  const prefix = byType(type)?.refdes || 'X';
  return `${prefix}${num}`;
};
