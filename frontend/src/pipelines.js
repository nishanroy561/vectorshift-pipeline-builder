// pipelines.js — My pipelines dashboard (wireframe Frame 2).
// Saved pipelines are persisted in MongoDB via the backend; open one to load
// it into the editor.

import { useState, useEffect, useCallback } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { listPipelines, deletePipeline } from './pipelineStorage';
import { notify, confirm } from './uiStore';

const FILTERS = ['All', 'Production', 'Draft', 'Archived'];

const STATUS_BADGE = {
  Production: { cls: 'ok', label: '● ran ok' },
  Draft: { cls: 'draft', label: '● draft' },
  Archived: { cls: 'draft', label: '● archived' },
  Failed: { cls: 'err', label: '● failed' },
};

const relative = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : d < 7 ? `${d}d ago` : `${Math.floor(d / 7)}w ago`;
};

const selector = (state) => ({
  nodes: state.nodes,
  loadPipeline: state.loadPipeline,
  clearCanvas: state.clearCanvas,
  setView: state.setView,
  savePipeline: state.savePipeline,
});

export const Pipelines = () => {
  const { nodes, loadPipeline, clearCanvas, setView, savePipeline } = useStore(selector, shallow);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setList(await listPipelines());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const open = (p) => {
    loadPipeline(p.nodes, p.edges, { id: p.id, name: p.name });
    setView('editor');
  };

  const newPipeline = async () => {
    if (nodes.length) {
      const ok = await confirm({
        title: 'Start a new pipeline?',
        message: 'The current sheet will be cleared.',
        confirmLabel: 'New pipeline',
        tone: 'danger',
      });
      if (!ok) return;
    }
    clearCanvas();
    setView('editor');
  };

  const saveCurrent = async () => {
    if (nodes.length === 0) {
      notify('The editor is empty — build a pipeline first, then save it here.', 'info');
      return;
    }
    try {
      await savePipeline();
      await refresh();
      notify('Pipeline saved.', 'success');
    } catch (e) {
      notify(`Couldn't save to the database: ${e.message}`, 'error');
    }
  };

  const del = async (e, id) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Delete this pipeline?',
      message: 'This permanently removes it from the database.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deletePipeline(id);
      await refresh();
      notify('Pipeline deleted.', 'success');
    } catch (err) {
      notify(`Couldn't delete: ${err.message}`, 'error');
    }
  };

  const visible = list.filter(
    (p) =>
      (filter === 'All' || p.status === filter) &&
      (p.name || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="vs-dash">
      <div className="vs-dash__inner">
        <div className="vs-dash__head">
          <div>
            <div className="vs-dash__title">My pipelines</div>
            <div className="vs-dash__sub">
              {loading ? 'loading…' : error ? 'database unavailable' : `${list.length} saved`}
            </div>
          </div>
          <div className="vs-dash__spacer" />
          <div className="vs-dash__search">
            <span className="vs-dash__search-icon">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pipelines…"
            />
          </div>
          <button type="button" className="vs-clear" onClick={saveCurrent}>Save current</button>
          <button type="button" className="vs-run" onClick={newPipeline}>+ New pipeline</button>
        </div>

        <div className="vs-dash__chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`vs-chip${filter === f ? ' vs-chip--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {error ? (
          <div className="vs-dash__empty">
            Couldn’t reach the database: {error}
            <br />
            Make sure the backend is running and <code>MONGO_URI</code> is set in <code>backend/.env</code>.
            <br />
            <button type="button" className="vs-clear" style={{ marginTop: 12 }} onClick={refresh}>Retry</button>
          </div>
        ) : loading ? (
          <div className="vs-dash__empty">Loading your pipelines…</div>
        ) : visible.length === 0 ? (
          <div className="vs-dash__empty">No pipelines yet. Build one in the editor and click “Save”.</div>
        ) : (
          <div className="vs-dash__grid">
            {visible.map((p) => {
              const badge = STATUS_BADGE[p.status] || STATUS_BADGE.Draft;
              return (
                <div className="vs-card" key={p.id} onClick={() => open(p)} role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && open(p)}>
                  <div className="vs-card__head">
                    <div className="vs-card__name">{p.name}</div>
                    <button type="button" className="vs-card__del" onClick={(e) => del(e, p.id)} aria-label="Delete">×</button>
                  </div>
                  <div className="vs-card__meta">edited {relative(p.updatedAt)}</div>
                  <div className="vs-card__foot">
                    <span className="vs-card__count">{(p.nodes || []).length} nodes</span>
                    <span className={`vs-card__badge vs-card__badge--${badge.cls}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
