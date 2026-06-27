// contextMenu.js
// The right-click menu for a node. Styled as a small ink-bordered card to match
// the schematic theme.

import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const selector = (state) => ({
  nodes: state.nodes,
  deleteNode: state.deleteNode,
  duplicateNode: state.duplicateNode,
  toggleNodeRunning: state.toggleNodeRunning,
});

export const NodeContextMenu = ({ id, top, left, onClose }) => {
  const { nodes, deleteNode, duplicateNode, toggleNodeRunning } = useStore(selector, shallow);
  const node = nodes.find((n) => n.id === id);
  const running = !!node?.data?.running;

  const run = (fn) => () => {
    fn();
    onClose();
  };

  // Focus the node's first editable field so the user can rename in place.
  const rename = () => {
    const el = document.querySelector(
      `.react-flow__node[data-id="${id}"] input, ` +
      `.react-flow__node[data-id="${id}"] textarea, ` +
      `.react-flow__node[data-id="${id}"] select`
    );
    if (el) {
      el.focus();
      if (typeof el.select === 'function') el.select();
    }
  };

  return (
    <div className="vs-menu" style={{ top, left }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="vs-menu__item" onClick={run(rename)}>Rename</button>
      <button type="button" className="vs-menu__item" onClick={run(() => duplicateNode(id))}>Duplicate</button>
      <button type="button" className="vs-menu__item" onClick={run(() => toggleNodeRunning(id))}>
        {running ? 'Stop' : 'Run'}
      </button>
      <div className="vs-menu__sep" />
      <button type="button" className="vs-menu__item vs-menu__item--danger" onClick={run(() => deleteNode(id))}>
        Delete
      </button>
    </div>
  );
};
