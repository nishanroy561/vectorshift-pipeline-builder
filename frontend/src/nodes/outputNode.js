// outputNode.js — a display sink. Its job is to show the value it receives, so
// after a run the produced value renders right inside the node.

import { BaseNode } from './BaseNode';

export const OutputNode = ({ id, data }) => {
  const ran = data?.runStatus === 'ok';
  const errored = data?.runStatus === 'error';

  return (
    <BaseNode
      id={id}
      data={data}
      category="sink"
      title="Output"
      inputs={[{ id: `${id}-value`, label: 'value' }]}
      showResultStrip={false}
      fields={[
        {
          key: 'outputName',
          label: 'Name',
          type: 'text',
          default: (nodeId) => nodeId.replace('customOutput-', 'output_'),
        },
      ]}
    >
      <div className="vs-output">
        <span className="vs-output__label">Result</span>
        {errored ? (
          <div className="vs-output__box vs-output__box--error">{data.runError}</div>
        ) : ran ? (
          <div className="vs-output__box">
            {data.runOutput !== undefined && data.runOutput !== '' ? data.runOutput : '(empty)'}
          </div>
        ) : (
          <div className="vs-output__box vs-output__box--await">Result appears here after Run</div>
        )}
      </div>
    </BaseNode>
  );
};
