// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    updateEdge,
    MarkerType,
  } from 'reactflow';
import { categoryForType } from './nodes/nodeCatalog';
import { categoryAccent } from './nodes/nodeTheme';
import { savePipeline as apiSavePipeline } from './pipelineStorage';

// `running` is always transient (only true mid-execution). Run *results*
// (runStatus/runOutput/runError) are kept on save so reopening a pipeline shows
// its last output, but dropped on export so a shared file is just the definition.
const stripVolatile = (data = {}) => {
  const { running, ...rest } = data;
  return rest;
};
const stripRunResults = (data = {}) => {
  const { runStatus, runOutput, runError, ...rest } = data;
  return rest;
};

// Node fields that hold credentials — redacted from shareable exports.
const SECRET_KEYS = ['apiKey', 'uri'];
const redactSecretFields = (data = {}) => {
  const out = { ...data };
  for (const k of SECRET_KEYS) if (k in out) out[k] = '';
  return out;
};

export const useStore = create((set, get) => ({
    nodes: [],
    edges: [],
    nodeIDs: {},
    // The pipeline's identity (its "file"). pipelineId is null until first save.
    pipelineId: null,
    pipelineName: 'Untitled pipeline',
    setPipelineName: (pipelineName) => set({ pipelineName: pipelineName || 'Untitled pipeline' }),
    // Which top-level screen is showing: 'editor' | 'playground' | 'pipelines'.
    view: 'editor',
    setView: (view) => set({ view }),
    // A snapshot of the current pipeline. Saving keeps the last run's results so
    // reopening shows them; { redactSecrets, keepRunState:false } gives a clean,
    // shareable export with no credentials and no run state.
    serializePipeline: ({ redactSecrets = false, keepRunState = true } = {}) => {
      const { pipelineId, pipelineName, nodes, edges } = get();
      return {
        id: pipelineId || `pl_${Date.now()}`,
        name: pipelineName || 'Untitled pipeline',
        nodes: nodes.map((n) => {
          let data = stripVolatile(n.data);
          if (!keepRunState) data = stripRunResults(data);
          if (redactSecrets) data = redactSecretFields(data);
          return { ...n, selected: false, data };
        }),
        edges,
      };
    },
    // Persist the current pipeline to MongoDB (via the backend) under its name,
    // keeping its id stable across re-saves. The id is locked in *before* the
    // network call so a rapid second Save updates the same record instead of
    // creating a duplicate.
    savePipeline: async () => {
      let id = get().pipelineId;
      if (!id) {
        id = `pl_${Date.now()}`;
        set({ pipelineId: id });
      }
      const record = { ...get().serializePipeline(), id, status: 'Draft' };
      const saved = await apiSavePipeline(record);
      set({ pipelineId: saved.id });
      return saved;
    },
    // Deselect every node (closes the run inspector).
    clearSelection: () =>
      set({ nodes: get().nodes.map((n) => (n.selected ? { ...n, selected: false } : n)) }),
    // Select exactly one node (opens the run inspector on it).
    selectOnly: (nodeId) =>
      set({ nodes: get().nodes.map((n) => ({ ...n, selected: n.id === nodeId })) }),
    // Replace the canvas with a saved pipeline, rebuilding the per-type id
    // counters so new nodes don't collide with the loaded ones.
    loadPipeline: (nodes, edges, meta) => {
      const nodeIDs = {};
      (nodes || []).forEach((n) => {
        const i = String(n.id).lastIndexOf('-');
        if (i === -1) return;
        const type = n.id.slice(0, i);
        const num = parseInt(n.id.slice(i + 1), 10);
        if (!Number.isNaN(num)) nodeIDs[type] = Math.max(nodeIDs[type] || 0, num);
      });
      set({
        nodes: nodes || [],
        edges: edges || [],
        nodeIDs,
        pipelineId: meta?.id ?? null,
        pipelineName: meta?.name ?? 'Untitled pipeline',
      });
    },
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection) => {
      // A trace is inked in the color of the component it leaves — the same
      // accent that tags that node's category.
      const sourceNode = get().nodes.find((n) => n.id === connection.source);
      const accent = categoryAccent(categoryForType(sourceNode?.type));
      set({
        edges: addEdge({
          ...connection,
          type: 'step',
          animated: false,
          style: { stroke: accent, strokeWidth: 1.75 },
          markerEnd: { type: MarkerType.Arrow, height: 15, width: 15, color: accent },
        }, get().edges),
      });
    },
    // Reconnect an existing edge to a new source/target handle (drag its end).
    // The trace is re-inked to match whatever node it now leaves.
    onEdgeUpdate: (oldEdge, newConnection) => {
      const sourceNode = get().nodes.find((n) => n.id === newConnection.source);
      const accent = categoryAccent(categoryForType(sourceNode?.type));
      const reStyled = {
        ...oldEdge,
        style: { ...oldEdge.style, stroke: accent, strokeWidth: 1.75 },
        markerEnd: { type: MarkerType.Arrow, height: 15, width: 15, color: accent },
      };
      set({ edges: updateEdge(reStyled, newConnection, get().edges) });
    },
    // Remove a single edge by id (used when an edge end is dropped on nothing).
    deleteEdge: (edgeId) => {
      set({ edges: get().edges.filter((e) => e.id !== edgeId) });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, [fieldName]: fieldValue } };
          }
          return node;
        }),
      });
    },
    // Remove a node and any traces wired to it.
    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== nodeId),
        edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      });
    },
    // Clone a node (and its field values) just below-right of the original.
    duplicateNode: (nodeId) => {
      const node = get().nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const newId = get().getNodeID(node.type);
      const { id: _omit, ...restData } = node.data || {};
      const clone = {
        ...node,
        id: newId,
        selected: false,
        position: { x: node.position.x + 44, y: node.position.y + 44 },
        data: { ...restData, id: newId, nodeType: node.type, running: false },
      };
      set({ nodes: [...get().nodes, clone] });
    },
    // Toggle a node's (visual) running state.
    toggleNodeRunning: (nodeId) => {
      set({
        nodes: get().nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, running: !n.data?.running } } : n
        ),
      });
    },
    // Mark every node as running (or not) — used while a run is in flight.
    setAllRunning: (running) => {
      set({
        nodes: get().nodes.map((n) => ({ ...n, data: { ...n.data, running } })),
      });
    },
    // Fold a run's per-node results back onto the nodes so they can display
    // their status and produced output. `nodeResults` is the backend's
    // node_results map: { [nodeId]: { status, output?, error? } }.
    applyRunResults: (nodeResults) => {
      const primary = (output) => {
        const vals = Object.values(output || {});
        const v = vals.length ? vals[0] : undefined;
        if (v === null || v === undefined) return '';
        return typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v);
      };
      set({
        nodes: get().nodes.map((n) => {
          const r = nodeResults?.[n.id];
          if (!r) return { ...n, data: { ...n.data, running: false } };
          return {
            ...n,
            data: {
              ...n.data,
              running: false,
              runStatus: r.status,
              runOutput: r.status === 'ok' ? primary(r.output) : undefined,
              runError: r.status === 'error' ? r.error : undefined,
            },
          };
        }),
      });
    },
    // Wipe run state (status, output, error) from every node.
    clearRunResults: () => {
      set({
        nodes: get().nodes.map((n) => ({
          ...n,
          data: { ...n.data, running: false, runStatus: undefined, runOutput: undefined, runError: undefined },
        })),
      });
    },
    // Reset the whole sheet to a fresh, unsaved pipeline.
    clearCanvas: () => {
      set({ nodes: [], edges: [], nodeIDs: {}, pipelineId: null, pipelineName: 'Untitled pipeline' });
    },
    // Auto-arrange: lay nodes out left-to-right in columns by following the
    // wires (a longest-path layering), so edges flow cleanly without crossing
    // over cards. Nodes in a column are stacked using their real heights.
    autoLayout: () => {
      const { nodes, edges } = get();
      if (nodes.length === 0) return;

      const ids = new Set(nodes.map((n) => n.id));
      const adj = {};
      const indeg = {};
      nodes.forEach((n) => { adj[n.id] = []; indeg[n.id] = 0; });
      edges.forEach((e) => {
        if (ids.has(e.source) && ids.has(e.target)) {
          adj[e.source].push(e.target);
          indeg[e.target] += 1;
        }
      });

      // Layer each node at (max incoming layer + 1) via Kahn's algorithm.
      const layer = {};
      const indegCopy = { ...indeg };
      const queue = nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
      queue.forEach((id) => { layer[id] = 0; });
      while (queue.length) {
        const cur = queue.shift();
        adj[cur].forEach((nxt) => {
          layer[nxt] = Math.max(layer[nxt] ?? 0, (layer[cur] ?? 0) + 1);
          indegCopy[nxt] -= 1;
          if (indegCopy[nxt] === 0) queue.push(nxt);
        });
      }
      // Any node left unlayered (e.g. inside a cycle) goes in column 0.
      nodes.forEach((n) => { if (layer[n.id] === undefined) layer[n.id] = 0; });

      const cols = {};
      nodes.forEach((n) => { (cols[layer[n.id]] ||= []).push(n); });

      const X0 = 60;
      const Y0 = 60;
      const GAP_X = 90;
      const GAP_Y = 44;
      const positioned = {};
      let x = X0;
      Object.keys(cols).map(Number).sort((a, b) => a - b).forEach((L) => {
        let y = Y0;
        let colW = 0;
        cols[L].forEach((n) => {
          positioned[n.id] = { ...n, position: { x, y }, selected: false };
          y += (n.height || 220) + GAP_Y;
          colW = Math.max(colW, n.width || 240);
        });
        x += colW + GAP_X;
      });

      set({ nodes: nodes.map((n) => positioned[n.id] || n) });
    },
  }));
