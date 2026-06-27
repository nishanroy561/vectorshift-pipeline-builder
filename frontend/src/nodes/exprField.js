// exprField.js
// --------------------------------------------------
// The Transform node's expression input with lightweight, n8n-style
// autocomplete. After a "." it suggests string/list methods; otherwise it
// suggests the safe functions the backend allows. Click or Tab/Enter to insert.

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store';

// Methods offered after a "." (these mirror common str/list operations).
const METHODS = [
  'upper()', 'lower()', 'strip()', 'lstrip()', 'rstrip()', 'title()',
  'capitalize()', 'swapcase()', 'split()', 'rsplit()', 'splitlines()',
  "replace('old', 'new')", 'startswith()', 'endswith()', 'find()', 'count()',
  'zfill()', 'center()', 'format()', 'join()',
];

// Functions offered for a bare word (must match the backend's _SAFE allow-list).
const FUNCS = [
  'value', 'str()', 'int()', 'float()', 'bool()', 'len()', 'sum()', 'min()',
  'max()', 'abs()', 'round()', 'sorted()', 'list()', 'dict()', 'set()',
  'tuple()', 'any()', 'all()', 'map()', 'filter()', 'range()',
];

const WORD = /[A-Za-z_][A-Za-z0-9_]*$/;

export const ExprField = ({ nodeId, field }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const value = useStore((s) => {
    const d = s.nodes.find((n) => n.id === nodeId)?.data;
    return d?.[field.key] ?? field.default ?? '';
  });
  const ref = useRef(null);
  const [menu, setMenu] = useState(null); // { items, start, caret, active }

  // Seed the default into the store so an untouched node still runs the default.
  useEffect(() => {
    const d = useStore.getState().nodes.find((n) => n.id === nodeId)?.data;
    if (d && d[field.key] === undefined && field.default !== undefined) {
      updateNodeField(nodeId, field.key, field.default);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeMenu = useCallback((text, caret) => {
    const before = text.slice(0, caret);
    const m = before.match(WORD);
    const token = m ? m[0] : '';
    const start = caret - token.length;
    const prev = before[start - 1];
    const pool = prev === '.' ? METHODS : FUNCS;
    const items = pool.filter((s) => s.toLowerCase().startsWith(token.toLowerCase()));
    if (!items.length || (token === '' && prev !== '.')) return null;
    return { items, start, caret, active: 0 };
  }, []);

  const sync = (el) => setMenu(computeMenu(el.value, el.selectionStart));

  const onChange = (e) => {
    updateNodeField(nodeId, field.key, e.target.value);
    sync(e.target);
  };

  const accept = (item) => {
    if (!menu) return;
    const next = value.slice(0, menu.start) + item + value.slice(menu.caret);
    updateNodeField(nodeId, field.key, next);
    setMenu(null);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      // Drop the caret inside empty "()" so the user can type args immediately.
      const pos = item.endsWith('()') ? menu.start + item.length - 1 : menu.start + item.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const onKeyDown = (e) => {
    e.stopPropagation(); // keep ReactFlow's Delete/Backspace shortcuts out of the field
    if (!menu) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMenu({ ...menu, active: (menu.active + 1) % menu.items.length });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMenu({ ...menu, active: (menu.active - 1 + menu.items.length) % menu.items.length });
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      accept(menu.items[menu.active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMenu(null);
    }
  };

  return (
    <label className="vs-field vs-expr">
      {field.label && <span className="vs-field__label">{field.label}</span>}
      <textarea
        ref={ref}
        className="vs-field__input vs-field__textarea nodrag nowheel"
        value={value}
        rows={field.rows || 2}
        spellCheck={false}
        placeholder="str(value).upper()"
        onChange={onChange}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => sync(e.target)}
        onClick={(e) => sync(e.target)}
        onBlur={() => setTimeout(() => setMenu(null), 120)}
      />
      {menu && (
        <ul className="vs-expr__menu nodrag nowheel">
          {menu.items.map((it, i) => (
            <li
              key={it}
              className={`vs-expr__item${i === menu.active ? ' vs-expr__item--active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); accept(it); }}
            >
              {it}
            </li>
          ))}
        </ul>
      )}
    </label>
  );
};
