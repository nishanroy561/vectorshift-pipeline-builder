// llmNode.js

import { BaseNode } from './BaseNode';
import { LLM_PROVIDERS, llmModelsFor, LLM_KEY_HINTS } from './modelCatalog';

export const LLMNode = ({ id, data }) => {
  const provider = data?.provider || 'groq';

  return (
    <BaseNode
      id={id}
      data={data}
      category="compute"
      title="LLM"
      inputs={[
        { id: `${id}-system`, label: 'system' },
        { id: `${id}-prompt`, label: 'prompt' },
        { id: `${id}-context`, label: 'context' },
      ]}
      outputs={[{ id: `${id}-response`, label: 'response' }]}
      fields={[
        {
          key: 'provider',
          label: 'Provider',
          type: 'select',
          default: 'groq',
          options: LLM_PROVIDERS,
          // Switching provider swaps in that provider's default model.
          onChange: (p, { setField }) => setField('model', llmModelsFor(p)[0]),
        },
        {
          key: 'model',
          label: 'Model',
          type: 'select',
          // The model list follows the chosen provider.
          options: (d) => llmModelsFor(d?.provider || 'groq'),
          default: (_id, d) => llmModelsFor(d?.provider || 'groq')[0],
        },
        {
          key: 'temperature',
          label: 'Temperature',
          type: 'number',
          default: '0.7',
        },
        {
          key: 'apiKey',
          label: 'API Key',
          type: 'password',
          default: '',
          placeholder: LLM_KEY_HINTS[provider] || 'provider API key',
        },
      ]}
    />
  );
};
