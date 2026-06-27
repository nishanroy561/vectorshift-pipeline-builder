// BaseNode.js
// --------------------------------------------------
// The one component every node is drawn from. It owns all shared chrome —
// the icon tile + title + actions, the description, the instance-id pill, the
// fields, the circular ports, and the run-result strip — so a concrete node
// only declares what makes it different: its title, category, ports, and fields.
//
//   <BaseNode
//     id={id}
//     category="compute"
//     title="LLM"
//     inputs={[{ id, label }]}
//     outputs={[{ id, label }]}
//     fields={[{ key, label, type, ... }]}
//   />

import { Handle, Position } from 'reactflow';
import { CATEGORIES, categoryIcon } from './nodeTheme';
import { nodeInfoForId } from './nodeCatalog';
import { NodeField } from './fields';
import { useStore } from '../store';

// A readable instance id, e.g. "knowledgeBase-1" -> "knowledge_base_1".
const idLabelFor = (id = '') =>
  id.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();

// Small action icons (duplicate / delete) shown on hover.
const DuplicateIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5.2" y="5.2" width="7.6" height="7.6" rx="1.6" />
    <path d="M3.2 10.8V4.6A1.4 1.4 0 0 1 4.6 3.2H10.8" strokeLinecap="round" />
  </svg>
);
const DeleteIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4.5h10M6.4 4.5V3.3h3.2v1.2M4.8 4.5l.6 8.3h5.2l.6-8.3" />
  </svg>
);

const Pin = ({ side, port, type }) => (
  <div
    className={`vs-pin vs-pin--${side}${port.warn ? ' vs-pin--warn' : ''}`}
    title={port.warn ? `"${port.label}" has no connection — it will stay as literal text` : undefined}
  >
    <Handle
      type={type}
      position={side === 'in' ? Position.Left : Position.Right}
      id={port.id}
      className={`vs-pad vs-pad--${side}${port.warn ? ' vs-pad--warn' : ''}`}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [side === 'in' ? 'left' : 'right']: -7,
      }}
    />
    <span className="vs-pin__label">{port.label}</span>
    {port.warn && <span className="vs-pin__warn" aria-hidden="true">⚠</span>}
  </div>
);

export const BaseNode = ({
  id,
  data,
  category = 'data',
  title,
  description,
  icon,
  inputs = [],
  outputs = [],
  fields = [],
  footer,
  footerWarn = false,
  width,
  children,
  showResultStrip = true,
}) => {
  const meta = CATEGORIES[category] || CATEGORIES.data;
  const info = nodeInfoForId(id);
  const nodeIcon = icon ?? categoryIcon(category, { size: 14, color: meta.accent });
  const nodeDesc = description ?? info?.desc;
  const idLabel = idLabelFor(id);
  const hasPins = inputs.length > 0 || outputs.length > 0;
  const deleteNode = useStore((s) => s.deleteNode);
  const duplicateNode = useStore((s) => s.duplicateNode);

  return (
    <div
      className={`vs-node vs-node--${category}${data?.running ? ' vs-node--running' : ''}`}
      style={{ '--accent': meta.accent, '--tint': meta.tint, ...(width ? { width } : null) }}
    >
      <header className="vs-node__head">
        <span className="vs-node__icon" aria-hidden="true">{nodeIcon}</span>
        <span className="vs-node__title">{title}</span>
        {data?.running && <span className="vs-node__run" title="Running" aria-label="Running" />}
        <span className="vs-node__actions nodrag">
          <button type="button" className="vs-node__act" title="Duplicate" onClick={() => duplicateNode(id)}>
            <DuplicateIcon />
          </button>
          <button type="button" className="vs-node__act vs-node__act--danger" title="Delete" onClick={() => deleteNode(id)}>
            <DeleteIcon />
          </button>
        </span>
      </header>

      {nodeDesc && <p className="vs-node__desc">{nodeDesc}</p>}
      <div className="vs-node__tag nodrag" title={idLabel}>{idLabel}</div>

      {(fields.length > 0 || children) && (
        <div className="vs-node__body">
          {fields.map((field) => (
            <NodeField key={field.key} nodeId={id} data={data} field={field} />
          ))}
          {children}
        </div>
      )}

      {hasPins && (
        <div className="vs-node__pins">
          <div className="vs-node__pins-col">
            {inputs.map((port) => (
              <Pin key={port.id} side="in" port={port} type="target" />
            ))}
          </div>
          <div className="vs-node__pins-col vs-node__pins-col--out">
            {outputs.map((port) => (
              <Pin key={port.id} side="out" port={port} type="source" />
            ))}
          </div>
        </div>
      )}

      {showResultStrip && data?.runStatus === 'error' && (
        <div className="vs-node__result vs-node__result--error">
          <div className="vs-node__result-label">Error</div>
          <div className="vs-node__result-box">{data.runError}</div>
        </div>
      )}
      {showResultStrip && data?.runStatus === 'ok' && data.runOutput !== undefined && data.runOutput !== '' && (
        <div className="vs-node__result">
          <div className="vs-node__result-label">Result</div>
          <div className="vs-node__result-box">{data.runOutput}</div>
        </div>
      )}

      {footer && <footer className={`vs-node__foot${footerWarn ? ' vs-node__foot--warn' : ''}`}>{footer}</footer>}
    </div>
  );
};
