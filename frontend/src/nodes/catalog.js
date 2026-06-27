// catalog.js — the Node Catalog screen: a full-page gallery of every node type
// grouped by category. Each card is a presentational preview of the node (it
// reuses the node card chrome but renders decorative ports, not live ReactFlow
// handles). A card's "＋ Add" drops a real node onto the canvas and switches to
// the editor.

import { useStore } from '../store';
import { CATEGORIES, categoryIcon } from './nodeTheme';
import { CATALOG_SPEC, PILL_FOR_CONTROL } from './catalogSpec';

const CatalogField = ({ field }) => {
  const pill = PILL_FOR_CONTROL[field.control] || 'Text';
  let control;
  if (field.control === 'area') {
    control = <div className="vs-field__input vs-field__textarea vs-cf__area">{field.value}</div>;
  } else if (field.control === 'secret') {
    control = (
      <div className="vs-cf__secret">
        <span className="vs-cf__dots">••••••••••••</span>
        <span className="vs-cf__show">show</span>
      </div>
    );
  } else if (field.control === 'drop') {
    control = <div className="vs-cf__drop">Drag a .txt file here, or <span>browse</span></div>;
  } else if (field.control === 'select') {
    control = (
      <div className="vs-cf__select">
        <span>{field.value}</span>
        <span className="vs-cf__caret">▼</span>
      </div>
    );
  } else {
    control = <div className={`vs-field__input${field.control === 'number' ? ' vs-cf__num' : ''}`}>{field.value}</div>;
  }
  return (
    <label className="vs-field">
      <span className="vs-field__labelrow">
        <span className="vs-field__label">{field.label}</span>
        <span className="vs-field__pill">{pill}</span>
      </span>
      {control}
    </label>
  );
};

const CatalogCard = ({ spec, onAdd }) => {
  const meta = CATEGORIES[spec.category] || CATEGORIES.data;
  const inputs = spec.inputs || [];
  const outputs = spec.outputs || [];
  const hasPins = !spec.noPorts && (inputs.length > 0 || outputs.length > 0);

  return (
    <div className="vs-node vs-catalog__card" style={{ '--accent': meta.accent, '--tint': meta.tint }}>
      <header className="vs-node__head">
        <span className="vs-node__icon" aria-hidden="true">{categoryIcon(spec.category, { size: 14, color: meta.accent })}</span>
        <span className="vs-node__title">{spec.title}</span>
        <button type="button" className="vs-catalog__add" onClick={() => onAdd(spec.type)} title={`Add ${spec.title} to canvas`}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8 3.5v9M3.5 8h9" /></svg>
          Add
        </button>
      </header>

      {spec.desc && <p className="vs-node__desc">{spec.desc}</p>}
      {!spec.noId && spec.instanceId && <div className="vs-node__tag">{spec.instanceId}</div>}

      {spec.fields.length > 0 && (
        <div className="vs-node__body">
          {spec.fields.map((f) => <CatalogField key={f.label} field={f} />)}
        </div>
      )}

      {hasPins && (
        <div className="vs-node__pins">
          <div className="vs-node__pins-col">
            {inputs.map((p) => (
              <div key={p} className="vs-pin vs-pin--in">
                <span className="vs-cf__pad vs-cf__pad--in" />
                <span className="vs-pin__label">{p}</span>
              </div>
            ))}
          </div>
          <div className="vs-node__pins-col vs-node__pins-col--out">
            {outputs.map((p) => (
              <div key={p} className="vs-pin vs-pin--out">
                <span className="vs-cf__pad vs-cf__pad--out" />
                <span className="vs-pin__label">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {spec.result && (
        <div className="vs-node__result">
          <div className="vs-node__result-label">Result</div>
          <div className="vs-node__result-box">{spec.result}</div>
        </div>
      )}
    </div>
  );
};

export const NodeCatalog = () => {
  const getNodeID = useStore((s) => s.getNodeID);
  const addNode = useStore((s) => s.addNode);
  const setView = useStore((s) => s.setView);

  const handleAdd = (type) => {
    const id = getNodeID(type);
    addNode({
      id,
      type,
      position: { x: 240 + Math.random() * 120, y: 160 + Math.random() * 120 },
      data: { id, nodeType: type },
    });
    setView('editor');
  };

  return (
    <div className="vs-catalog">
      <div className="vs-catalog__inner">
        <div className="vs-catalog__title">Node Catalog</div>
        <div className="vs-catalog__sub">
          Typed building blocks. Wire a node’s output port into another node’s input to compose a runnable pipeline.
        </div>

        {CATALOG_SPEC.map((group) => (
          <div key={group.key} className="vs-catalog__group">
            <div className="vs-catalog__group-head">
              <span className="vs-catalog__dot" style={{ background: CATEGORIES[group.key].accent }} />
              <span className="vs-catalog__group-label">{group.label}</span>
              <span className="vs-catalog__count">{group.nodes.length}</span>
              <span className="vs-catalog__rule" />
            </div>
            <div className="vs-catalog__grid">
              {group.nodes.map((n) => (
                <CatalogCard key={n.type} spec={{ ...n, category: group.key }} onAdd={handleAdd} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
