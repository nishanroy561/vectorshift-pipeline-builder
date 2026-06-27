// submit.js
// The pipeline actions, split into two clusters per the design:
//   • RunActions    — header right side: Run (execute) + Deploy.
//   • WorkspaceTools — palette-bar right side: live graph metadata
//     (node/edge count + last DAG check) and the editing tools
//     (Check pipeline, Save, Export, Clear sheet).
// API keys live on each LLM node.

import { useState, useRef } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { notify, confirm } from './uiStore';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const PARSE_ENDPOINT = `${API_BASE}/pipelines/parse`;
const RUN_ENDPOINT = `${API_BASE}/pipelines/run`;

const slugify = (name) =>
  (name || 'pipeline').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pipeline';

// ---- Header: Run + Deploy -------------------------------------------------

const runSelector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  setAllRunning: state.setAllRunning,
  applyRunResults: state.applyRunResults,
  clearRunResults: state.clearRunResults,
  selectOnly: state.selectOnly,
});

export const RunActions = () => {
  const { nodes, edges, setAllRunning, applyRunResults, clearRunResults, selectOnly } = useStore(runSelector, shallow);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    if (nodes.length === 0) return;

    // Catch the common Text-node mistake: a {{ variable }} with no wire feeding
    // it passes through as literal text. Warn (but let them run anyway).
    // A variable also counts as connected if an Input node shares its name —
    // the backend resolves {{ name }} by name, same as the Text node's own UI.
    const VAR_RE = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;
    const inputNames = new Set(
      nodes
        .filter((n) => n.type === 'customInput')
        .map((n) => n.data?.inputName || n.id.replace('customInput-', 'input_'))
    );
    const danglingVars = [];
    for (const n of nodes) {
      if (n.type !== 'text') continue;
      const names = [...new Set([...(n.data?.text || '').matchAll(VAR_RE)].map((m) => m[1]))];
      for (const name of names) {
        const wired = edges.some((e) => e.target === n.id && e.targetHandle === `${n.id}-${name}`);
        if (!wired && !inputNames.has(name)) danglingVars.push(`• ${n.id}: {{ ${name} }}`);
      }
    }
    if (danglingVars.length) {
      const proceed = await confirm({
        title: 'Unconnected Text variables',
        message:
          'These variables have no connection and will stay as literal text:\n\n' +
          danglingVars.join('\n') +
          '\n\nWire an input to each variable’s handle, or run anyway?',
        confirmLabel: 'Run anyway',
      });
      if (!proceed) return;
    }

    // Keys are entered on each LLM node — warn if any LLM node is missing one.
    const llmMissingKey = nodes.some((n) => n.type === 'llm' && !(n.data?.apiKey || '').trim());
    if (llmMissingKey) {
      notify('An LLM node has no API key. Paste your Groq or OpenRouter key into the LLM node’s "API Key" field, then run again.', 'error');
      return;
    }

    setRunning(true);
    clearRunResults();
    setAllRunning(true);
    try {
      const response = await fetch(RUN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);

      const data = await response.json();
      applyRunResults(data.node_results);

      if (data.error) {
        notify(`Pipeline did not run: ${data.error}`, 'error');
        return;
      }

      // Auto-open the Run inspector on a result so the output is visible without
      // hunting for it. Prefer an Output node that produced something; fall back
      // to a Display node, then any node with output.
      const results = data.node_results || {};
      const hasOutput = (id) =>
        results[id]?.status === 'ok' &&
        results[id]?.output &&
        Object.values(results[id].output).some((v) => v !== null && v !== undefined && v !== '');
      const pick =
        nodes.find((n) => n.type === 'customOutput' && hasOutput(n.id)) ||
        nodes.find((n) => n.type === 'customOutput') ||
        nodes.find((n) => n.type === 'display' && hasOutput(n.id)) ||
        nodes.find((n) => hasOutput(n.id));
      if (pick) selectOnly(pick.id);

      const errorLines = (data.errors || []).map((e) => `• ${e}`);
      if (errorLines.length) {
        notify('Pipeline ran with errors:\n' + errorLines.join('\n'), 'error');
      } else {
        notify('Pipeline ran successfully — results are on the canvas.', 'success');
      }
    } catch (error) {
      setAllRunning(false);
      notify(`Can't reach the pipeline server (${error.message}). Start it: cd backend && uvicorn main:app --reload`, 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleDeploy = () => {
    notify('Deploy is coming soon — save your pipeline and run it locally for now.', 'info');
  };

  return (
    <div className="vs-actions">
      <button type="button" className="vs-btn vs-btn--ghost" onClick={handleRun} disabled={running || nodes.length === 0}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3.5l8 4.5-8 4.5z" /></svg>
        {running ? 'Running…' : 'Run'}
      </button>
      <button type="button" className="vs-btn vs-btn--primary" onClick={handleDeploy}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1.5c2.6 1.1 4 3.6 4 6.3 0 1.2-.3 2.3-.8 3.2H4.8c-.5-.9-.8-2-.8-3.2 0-2.7 1.4-5.2 4-6.3z" /><circle cx="8" cy="6.4" r="1.2" /><path d="M5.6 11l-1.2 2.4M10.4 11l1.2 2.4" /></svg>
        Deploy
      </button>
    </div>
  );
};

// ---- Palette bar: metadata + editing tools --------------------------------

const toolsSelector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  clearCanvas: state.clearCanvas,
  savePipeline: state.savePipeline,
  serializePipeline: state.serializePipeline,
  loadPipeline: state.loadPipeline,
});

export const WorkspaceTools = () => {
  const { nodes, edges, clearCanvas, savePipeline, serializePipeline, loadPipeline } = useStore(toolsSelector, shallow);
  const [status, setStatus] = useState(null); // null | 'dag' | 'cyclic'
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const importRef = useRef(null);

  const handleSave = async () => {
    if (nodes.length === 0) {
      notify('Nothing to save — the sheet is empty.', 'info');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await savePipeline();
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      notify('Pipeline saved to the cloud.', 'success');
    } catch (error) {
      notify(`Couldn't save to the database: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (nodes.length === 0) {
      notify('Nothing to export — the sheet is empty.', 'info');
      return;
    }
    const pipeline = serializePipeline({ redactSecrets: true, keepRunState: false });
    const blob = new Blob([JSON.stringify(pipeline, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(pipeline.name)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Load a pipeline from an exported .json file onto the canvas. Imported
  // graphs come in unsaved (no id) so saving won't clobber an existing record.
  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be re-imported later
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => notify("Couldn't read the file.", 'error');
    reader.onload = async () => {
      let data;
      try {
        data = JSON.parse(String(reader.result || ''));
      } catch {
        notify("Couldn't import: the file isn't valid JSON.", 'error');
        return;
      }
      if (!Array.isArray(data?.nodes) || !Array.isArray(data?.edges)) {
        notify('Couldn\'t import: JSON needs "nodes" and "edges" arrays.', 'error');
        return;
      }
      if (nodes.length > 0) {
        const ok = await confirm({
          title: 'Replace current pipeline?',
          message: 'Importing will replace the nodes and traces on the canvas.',
          confirmLabel: 'Import',
        });
        if (!ok) return;
      }
      loadPipeline(data.nodes, data.edges, { id: null, name: data.name || 'Imported pipeline' });
      setStatus(null);
      notify(`Imported ${data.nodes.length} node${data.nodes.length === 1 ? '' : 's'}.`, 'success');
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (nodes.length === 0) return;
    const ok = await confirm({
      title: 'Clear the sheet?',
      message: 'This removes every node and trace from the canvas.',
      confirmLabel: 'Clear sheet',
      tone: 'danger',
    });
    if (ok) {
      clearCanvas();
      setStatus(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(PARSE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);

      const { num_nodes, num_edges, is_dag } = await response.json();
      setStatus(is_dag ? 'dag' : 'cyclic');

      // The assessment asks for an alert with the parse result; the toast below
      // is the nicer in-app version of the same information.
      window.alert(
        `Pipeline summary\n\n` +
        `Nodes:  ${num_nodes}\n` +
        `Edges:  ${num_edges}\n` +
        `Is DAG: ${is_dag ? 'Yes ✓' : 'No ✗'}`
      );

      notify(
        `${num_nodes} node${num_nodes === 1 ? '' : 's'} · ${num_edges} edge${num_edges === 1 ? '' : 's'} — ` +
        (is_dag ? 'Valid DAG, no cycles.' : 'Cyclic — the pipeline feeds back on itself.'),
        is_dag ? 'success' : 'error'
      );
    } catch (error) {
      setStatus(null);
      notify(`Can't reach the pipeline server (${error.message}). Start it: cd backend && uvicorn main:app --reload`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = status === 'dag' ? 'Valid DAG' : status === 'cyclic' ? 'Cyclic' : '—';

  return (
    <div className="vs-tools">
      <dl className="vs-meta">
        <div className="vs-meta__cell">
          <dt>Nodes</dt>
          <dd>{nodes.length}</dd>
        </div>
        <div className="vs-meta__cell">
          <dt>Edges</dt>
          <dd>{edges.length}</dd>
        </div>
        <div className={`vs-meta__cell vs-meta__cell--status vs-meta__cell--${status || 'none'}`}>
          <dt>Status</dt>
          <dd><span className="vs-meta__dot" />{statusLabel}</dd>
        </div>
      </dl>
      <button type="button" className="vs-clear" onClick={handleSave} disabled={nodes.length === 0 || saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
      <button type="button" className="vs-clear" onClick={handleExport} disabled={nodes.length === 0}>
        Export
      </button>
      <button type="button" className="vs-clear" onClick={() => importRef.current?.click()}>
        Import
      </button>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="vs-file__input"
        onChange={handleImportFile}
      />
      <button type="button" className="vs-clear" onClick={handleClear} disabled={nodes.length === 0}>
        Clear
      </button>
      <button type="button" className="vs-check" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Checking…' : 'Check pipeline'}
      </button>
    </div>
  );
};
