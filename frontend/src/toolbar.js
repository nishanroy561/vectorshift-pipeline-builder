// toolbar.js — the node palette bar across the top of the canvas: a search box
// and category tabs on the left, the matching draggable node chips below, and
// the workspace tools (graph metadata + Check / Save / Export / Clear) on the
// right.

import { useState, useMemo } from 'react';
import { DraggableNode } from './draggableNode';
import { NODE_CATALOG } from './nodes/nodeCatalog';
import { CATEGORIES } from './nodes/nodeTheme';
import { WorkspaceTools } from './submit';

const groupsInOrder = Object.keys(CATEGORIES).filter((cat) =>
  NODE_CATALOG.some((n) => n.category === cat)
);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const PipelineToolbar = () => {
  const [active, setActive] = useState(groupsInOrder[0]);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  // Searching spans every category; otherwise show just the active tab's nodes.
  const visible = useMemo(() => {
    if (searching) return NODE_CATALOG.filter((n) => n.label.toLowerCase().includes(q));
    return NODE_CATALOG.filter((n) => n.category === active);
  }, [searching, q, active]);

  const pickTab = (cat) => {
    setActive(cat);
    setQuery('');
  };

  return (
    <div className="vs-palette">
      <div className="vs-palette__row">
        <div className="vs-palette__search">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="7" cy="7" r="4.2" />
            <path d="M10.2 10.2L13.5 13.5" strokeLinecap="round" />
          </svg>
          <input
            className="vs-palette__search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes"
            spellCheck={false}
          />
          {searching && (
            <button
              type="button"
              className="vs-palette__search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="vs-palette__tabs" role="tablist">
          {groupsInOrder.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={cat === active && !searching}
              className={`vs-palette__tab${cat === active && !searching ? ' vs-palette__tab--active' : ''}`}
              onClick={() => pickTab(cat)}
            >
              {cap(CATEGORIES[cat].label)}
            </button>
          ))}
        </div>

        <div className="vs-palette__spacer" />
        <WorkspaceTools />
      </div>

      <div className="vs-palette__chips">
        {visible.length === 0 ? (
          <div className="vs-palette__empty">No nodes match “{query}”.</div>
        ) : (
          visible.map((n) => (
            <DraggableNode
              key={n.type}
              type={n.type}
              label={n.label}
              category={n.category}
            />
          ))
        )}
      </div>
    </div>
  );
};
