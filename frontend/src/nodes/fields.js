// fields.js
// --------------------------------------------------
// Declarative form controls for nodes. A node lists its inputs as plain
// config objects ({ key, label, type, ... }) and NodeField renders + wires
// each one to the store, so a new node never re-implements form plumbing.

import { useStore } from '../store';

const resolveDefault = (field, nodeId, data) =>
  typeof field.default === 'function'
    ? field.default(nodeId, data)
    : field.default ?? '';

const normalizeOptions = (options = []) =>
  options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

export const NodeField = ({ nodeId, data, field }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  const stored = data?.[field.key];
  const value = stored !== undefined ? stored : resolveDefault(field, nodeId, data);
  const onChange = (e) => {
    const next = e.target.value;
    updateNodeField(nodeId, field.key, next);
    // A field may react to its own change — e.g. switching Provider resets the
    // Model to that provider's default. `setField` updates a sibling field.
    field.onChange?.(next, {
      data,
      setField: (key, val) => updateNodeField(nodeId, key, val),
    });
  };

  let control;
  if (field.type === 'select') {
    // Options can be static or derived from the node's data (e.g. the model
    // list depends on the chosen provider).
    const opts = normalizeOptions(
      typeof field.options === 'function' ? field.options(data) : field.options
    );
    // If the stored value isn't a current option (a provider switch mid-flight,
    // or a model loaded from an older pipeline), keep it visible so it's never
    // silently dropped.
    const known = opts.some((o) => String(o.value) === String(value));
    control = (
      <select className="vs-field__select" value={value} onChange={onChange}>
        {!known && value !== '' && value !== undefined && (
          <option value={value}>{value}</option>
        )}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (field.type === 'textarea') {
    control = (
      <textarea
        className="vs-field__input vs-field__textarea"
        value={value}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        onChange={onChange}
      />
    );
  } else {
    const inputType =
      field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text';
    control = (
      <input
        className="vs-field__input"
        type={inputType}
        value={value}
        placeholder={field.placeholder}
        onChange={onChange}
        autoComplete={field.type === 'password' ? 'off' : undefined}
        spellCheck={field.type === 'password' ? false : undefined}
      />
    );
  }

  const pill = PILLS[field.type] || PILLS.text;

  return (
    <label className="vs-field">
      {(field.label || pill) && (
        <span className="vs-field__labelrow">
          {field.label && <span className="vs-field__label">{field.label}</span>}
          <span className={`vs-field__pill vs-field__pill--${pill.kind}`}>{pill.text}</span>
        </span>
      )}
      {control}
    </label>
  );
};

// Small type badge shown on each field's label (à la VectorShift).
const PILLS = {
  text: { text: 'Text', kind: 'text' },
  textarea: { text: 'Text', kind: 'text' },
  number: { text: 'Number', kind: 'number' },
  select: { text: 'Dropdown', kind: 'select' },
  password: { text: 'Secret', kind: 'secret' },
};
