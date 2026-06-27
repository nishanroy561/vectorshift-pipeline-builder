// embedderNode.js — turns text into a vector embedding. "Local (offline)" uses
// a built-in deterministic embedder (no key); any other provider calls a real
// embedding API with a BYOK key.

import { BaseNode } from './BaseNode';
import {
  EMBEDDER_PROVIDERS,
  embedderModelsFor,
  EMBEDDER_KEY_HINTS,
} from './modelCatalog';

export const EmbedderNode = ({ id, data }) => {
  const provider = data?.provider || 'local';
  const isLocal = provider === 'local';

  const fields = [
    {
      key: 'provider',
      label: 'Provider',
      type: 'select',
      default: 'local',
      options: EMBEDDER_PROVIDERS,
      // Switching provider swaps in that provider's default model.
      onChange: (p, { setField }) => setField('model', embedderModelsFor(p)[0]),
    },
    {
      key: 'model',
      label: 'Model',
      type: 'select',
      options: (d) => embedderModelsFor(d?.provider || 'local'),
      default: (_id, d) => embedderModelsFor(d?.provider || 'local')[0],
    },
  ];

  // The local embedder needs no credentials; external ones do.
  if (!isLocal) {
    fields.push({
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      default: '',
      placeholder: EMBEDDER_KEY_HINTS[provider] || 'provider API key',
    });
  }

  return (
    <BaseNode
      id={id}
      data={data}
      category="compute"
      title="Embedder"
      inputs={[{ id: `${id}-text`, label: 'text' }]}
      outputs={[{ id: `${id}-embedding`, label: 'embedding' }]}
      fields={fields}
      footer={isLocal ? 'local · 64-dim hash vector' : `${provider} · live embedding`}
    />
  );
};
