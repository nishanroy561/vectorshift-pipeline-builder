// modelCatalog.js — curated model lists for the LLM and Embedder nodes.
// Kept in step with the backend (providers.py). The dropdowns offer these
// options; a value loaded from a saved pipeline that isn't listed still shows.

// ---- LLM (chat) ----------------------------------------------------------
// Every provider here exposes an OpenAI-compatible chat endpoint, so they all
// run through the same backend call. All have a free key or free credits.
export const LLM_PROVIDERS = [
  { value: 'groq', label: 'Groq' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'cerebras', label: 'Cerebras' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'together', label: 'Together AI' },
  { value: 'sambanova', label: 'SambaNova' },
];

export const LLM_MODELS = {
  groq: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
  ],
  openrouter: [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'meta-llama/llama-3.3-70b-instruct',
    'google/gemini-2.0-flash-001',
    'deepseek/deepseek-chat',
  ],
  google: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ],
  cerebras: [
    'llama-3.3-70b',
    'llama3.1-8b',
    'qwen-3-32b',
  ],
  mistral: [
    'mistral-small-latest',
    'open-mistral-nemo',
    'ministral-8b-latest',
  ],
  together: [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
  ],
  sambanova: [
    'Meta-Llama-3.3-70B-Instruct',
    'Meta-Llama-3.1-8B-Instruct',
  ],
};

export const llmModelsFor = (provider) => LLM_MODELS[provider] || LLM_MODELS.groq;

// Where to grab a key — shown as the LLM API-key field's placeholder.
export const LLM_KEY_HINTS = {
  groq: 'console.groq.com/keys · free',
  openrouter: 'openrouter.ai/keys · free models available',
  google: 'aistudio.google.com/apikey · free, generous',
  cerebras: 'cloud.cerebras.ai · free, very fast',
  mistral: 'console.mistral.ai · free tier',
  together: 'api.together.xyz · $1 free credit',
  sambanova: 'cloud.sambanova.ai · free',
};

// ---- Embedder ------------------------------------------------------------
// `local` runs offline with no key; the rest call a real embedding API with a
// BYOK key. Order roughly by how friendly the free tier is.
export const EMBEDDER_PROVIDERS = [
  { value: 'local', label: 'Local (offline)' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'jina', label: 'Jina AI' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'voyage', label: 'Voyage AI' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'together', label: 'Together AI' },
  { value: 'openai', label: 'OpenAI' },
];

export const EMBEDDER_MODELS = {
  local: ['local-minilm'],
  google: ['text-embedding-004'],
  jina: ['jina-embeddings-v3', 'jina-embeddings-v2-base-en'],
  mistral: ['mistral-embed'],
  voyage: ['voyage-3-lite', 'voyage-3'],
  cohere: ['embed-english-v3.0', 'embed-multilingual-v3.0'],
  together: ['BAAI/bge-base-en-v1.5', 'togethercomputer/m2-bert-80M-8k-retrieval'],
  openai: ['text-embedding-3-small', 'text-embedding-3-large'],
};

export const embedderModelsFor = (provider) => EMBEDDER_MODELS[provider] || EMBEDDER_MODELS.local;

// Where to grab a key — shown as the API-key field's placeholder. The ones
// marked free hand out a key with no card and real monthly credits.
export const EMBEDDER_KEY_HINTS = {
  google: 'aistudio.google.com/apikey · free, generous',
  jina: 'jina.ai · 1M free tokens, no card',
  mistral: 'console.mistral.ai · free tier',
  voyage: 'voyageai.com · 200M free tokens',
  cohere: 'dashboard.cohere.com · free trial key',
  together: 'api.together.xyz · $1 free credit',
  openai: 'platform.openai.com · paid',
};
