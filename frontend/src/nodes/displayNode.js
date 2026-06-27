// displayNode.js — a debug "scope": wire it to any value to inspect the FULL,
// formatted result with a copy button. (Output, by contrast, is the named,
// collected deliverable.)

import { useState } from 'react';
import { BaseNode } from './BaseNode';

export const DisplayNode = ({ id, data }) => {
  const [copied, setCopied] = useState(false);
  const ran = data?.runStatus === 'ok';
  const errored = data?.runStatus === 'error';
  const text = errored ? data.runError ?? '' : data?.runOutput ?? '';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <BaseNode
      id={id}
      data={data}
      category="sink"
      title="Display"
      width={264}
      inputs={[{ id: `${id}-value`, label: 'value' }]}
      showResultStrip={false}
    >
      <div className="vs-display">
        <div className="vs-display__bar">
          <span className="vs-display__label">Inspector</span>
          {(ran || errored) && (
            <button type="button" className="vs-display__copy nodrag" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          )}
        </div>
        {errored ? (
          <pre className="vs-display__box vs-display__box--error nodrag nowheel">{text}</pre>
        ) : ran ? (
          <pre className="vs-display__box nodrag nowheel">{text === '' ? '(empty)' : text}</pre>
        ) : (
          <div className="vs-display__await">Wire a value in and Run to inspect it.</div>
        )}
      </div>
    </BaseNode>
  );
};
