// playground.js — Run screen (wireframe Frame 5).
// Left: the pipeline's Input nodes as editable fields. Right: the Output
// nodes' results after a run, with a run-metadata footer.

import { useState } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { CATEGORIES } from './nodes/nodeTheme';
import { refdesForId } from './nodes/nodeCatalog';
import { notify } from './uiStore';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const RUN_ENDPOINT = `${API_BASE}/pipelines/run`;

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateNodeField: state.updateNodeField,
  setAllRunning: state.setAllRunning,
  applyRunResults: state.applyRunResults,
  clearRunResults: state.clearRunResults,
});

const sourceAccent = CATEGORIES.source.accent;

export const Playground = () => {
  const { nodes, edges, updateNodeField, setAllRunning, applyRunResults, clearRunResults } =
    useStore(selector, shallow);

  const [running, setRunning] = useState(false);
  const [runNo, setRunNo] = useState(0);
  const [results, setResults] = useState(null); // { [outputNodeId]: value }
  const [elapsed, setElapsed] = useState(null);
  const [error, setError] = useState(null);

  const inputs = nodes.filter((n) => n.type === 'customInput');
  const outputs = nodes.filter((n) => n.type === 'customOutput');

  const handleRun = async () => {
    if (nodes.length === 0) return;
    const missingKey = nodes.some((n) => n.type === 'llm' && !(n.data?.apiKey || '').trim());
    if (missingKey) {
      notify('An LLM node has no API key. Add it on the LLM node in the editor, then run.', 'error');
      return;
    }
    setRunning(true);
    setError(null);
    clearRunResults();
    setAllRunning(true);
    const started = performance.now();
    try {
      const response = await fetch(RUN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      const data = await response.json();
      applyRunResults(data.node_results);
      setElapsed(((performance.now() - started) / 1000).toFixed(2));
      setRunNo((n) => n + 1);
      setResults(data.results || {});
      if (data.error) setError(data.error);
      else if ((data.errors || []).length) setError(data.errors.join(' · '));
    } catch (err) {
      setAllRunning(false);
      setError(`Can't reach the pipeline server. Start it with: cd backend && uvicorn main:app --reload`);
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    clearRunResults();
    setResults(null);
    setElapsed(null);
    setError(null);
  };

  const fmt = (v) => (v === null || v === undefined ? '(empty)' : typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v));

  return (
    <div className="vs-pg">
      <div className="vs-pg__head">
        <div>
          <div className="vs-pg__title">Playground</div>
          <div className="vs-pg__sub">{running ? 'running…' : 'ready'} · {nodes.length} nodes</div>
        </div>
        <div className="vs-pg__spacer" />
        <div className="vs-meta__cell">
          <dt>Run #</dt>
          <dd>{String(runNo).padStart(4, '0')}</dd>
        </div>
        <button type="button" className="vs-clear" onClick={handleReset}>Reset</button>
        <button type="button" className="vs-run" onClick={handleRun} disabled={running || nodes.length === 0}>
          <span className="vs-run__tri">▶</span> {running ? 'Running…' : 'Run'}
        </button>
      </div>

      <div className="vs-pg__body">
        <div className="vs-pg__inputs">
          <div className="vs-pg__section">INPUTS</div>
          {inputs.length === 0 && (
            <div className="vs-pg__hint">Add an Input node in the editor — its value shows up here to edit before each run.</div>
          )}
          {inputs.map((n) => (
            <div className="vs-pg__field" key={n.id}>
              <div className="vs-pg__field-head">
                <span className="vs-pg__dot" style={{ background: sourceAccent }} />
                <span className="vs-pg__field-name">{n.data?.inputName || 'Input'}</span>
                <span className="vs-pg__field-tag">{refdesForId(n.id)} · value</span>
              </div>
              <textarea
                className="vs-pg__textarea"
                value={n.data?.value || ''}
                placeholder="Enter a value…"
                onChange={(e) => updateNodeField(n.id, 'value', e.target.value)}
              />
            </div>
          ))}
          <div className="vs-pg__note">Inputs map to the pipeline's Input nodes. Edit values and press Run to re-execute.</div>
        </div>

        <div className="vs-pg__output">
          <div className="vs-pg__output-scroll">
            <div className="vs-pg__output-head">
              <span className="vs-pg__section">OUTPUT</span>
              {results && !error && <span className="vs-pg__ok">✓ Completed{elapsed ? ` in ${elapsed}s` : ''}</span>}
              {error && <span className="vs-pg__err">✗ {error}</span>}
            </div>

            {!results && !error && (
              <div className="vs-pg__placeholder">Press Run to execute the pipeline and see Output node results here.</div>
            )}

            {outputs.map((n) => (
              <div className="vs-pg__result" key={n.id}>
                <div className="vs-pg__result-head">
                  <span className="vs-pg__result-name">{n.data?.outputName || 'Output'}</span>
                  <span className="vs-pg__field-tag">{refdesForId(n.id)} · value</span>
                </div>
                <div className="vs-pg__result-body">
                  {results ? fmt(results[n.id]) : <span className="vs-pg__await">awaiting run…</span>}
                </div>
              </div>
            ))}
            {results && outputs.length === 0 && (
              <div className="vs-pg__placeholder">This pipeline has no Output nodes. Add one to capture a result.</div>
            )}
          </div>

          <div className="vs-pg__footer">
            <div><span className="vs-pg__fk">LATENCY</span> <span className="vs-pg__fv">{elapsed ? `${elapsed}s` : '—'}</span></div>
            <div><span className="vs-pg__fk">TOKENS</span> <span className="vs-pg__fv">—</span></div>
            <div><span className="vs-pg__fk">COST</span> <span className="vs-pg__fv">—</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
