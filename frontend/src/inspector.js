// inspector.js — Run inspector side panel (wireframe Frame 4).
// Shows the selected node's identity, run status, and last output/error.

import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { CATEGORIES } from './nodes/nodeTheme';
import { categoryForType } from './nodes/nodeCatalog';

// "knowledgeBase-1" -> "knowledge_base_1"
const idLabelFor = (id = '') =>
  id.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();

const selector = (state) => ({
  nodes: state.nodes,
  clearSelection: state.clearSelection,
});

const STATUS = {
  ok: { cls: 'ok', label: '✓ Completed' },
  error: { cls: 'error', label: '✗ Error' },
  skipped: { cls: 'idle', label: '◦ Skipped' },
};

export const RunInspector = () => {
  const { nodes, clearSelection } = useStore(selector, shallow);
  const selected = nodes.filter((n) => n.selected);
  // Only inspect when exactly one node is selected.
  if (selected.length !== 1) return null;

  const node = selected[0];
  const data = node.data || {};
  const category = categoryForType(node.type);
  const accent = (CATEGORIES[category] || CATEGORIES.data).accent;
  const status = STATUS[data.runStatus] || { cls: 'idle', label: '◦ Not run yet' };

  return (
    <aside className="vs-inspector" style={{ '--accent': accent }}>
      <div className="vs-inspector__head">
        <div>
          <div className="vs-inspector__title">Run inspector</div>
          <div className="vs-inspector__id">
            <span className="vs-inspector__id-dot" />
            <span className="vs-inspector__id-text">{idLabelFor(node.id)}</span>
          </div>
        </div>
        <button type="button" className="vs-inspector__x" onClick={clearSelection} aria-label="Close inspector">×</button>
      </div>

      <div className="vs-inspector__body">
        <div className={`vs-inspector__status vs-inspector__status--${status.cls}`}>{status.label}</div>

        <div className="vs-cells">
          <div className="vs-cells__cell">
            <div className="vs-cells__k">TYPE</div>
            <div className="vs-cells__v">{node.type}</div>
          </div>
          <div className="vs-cells__cell">
            <div className="vs-cells__k">CATEGORY</div>
            <div className="vs-cells__v">{category}</div>
          </div>
        </div>

        <div className="vs-inspector__section">OUTPUT</div>
        {data.runStatus === 'error' ? (
          <div className="vs-inspector__out vs-inspector__out--error">{data.runError || 'Failed.'}</div>
        ) : data.runOutput !== undefined && data.runOutput !== '' ? (
          <div className="vs-inspector__out vs-inspector__out--result">{data.runOutput}</div>
        ) : (
          <div className="vs-inspector__out vs-inspector__await">Run the pipeline to see this node's output.</div>
        )}
      </div>
    </aside>
  );
};
