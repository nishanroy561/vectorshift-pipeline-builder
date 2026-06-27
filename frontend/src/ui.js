// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { Background, MiniMap, BackgroundVariant, Panel, useReactFlow, useViewport } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { nodeTypes } from './nodes/nodeTypes';
import { categoryAccent } from './nodes/nodeTheme';
import { categoryForType } from './nodes/nodeCatalog';
import { NodeContextMenu } from './contextMenu';

import 'reactflow/dist/style.css';

const gridSize = 24;
const proOptions = { hideAttribution: true };
const defaultEdgeOptions = { type: 'step' };

// Custom zoom control matching the wireframe: ± buttons, a live % readout,
// and Fit. Rendered inside <ReactFlow> so the reactflow hooks have context.
function ZoomPanel() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  const autoLayout = useStore((s) => s.autoLayout);
  const arrange = () => {
    autoLayout();
    // Let the new positions commit, then frame the whole graph.
    requestAnimationFrame(() => fitView({ duration: 400, padding: 0.2 }));
  };
  return (
    <div className="vs-zoom">
      <div className="vs-zoom__pm">
        <button type="button" onClick={() => zoomIn({ duration: 150 })} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomOut({ duration: 150 })} aria-label="Zoom out">−</button>
      </div>
      <div className="vs-zoom__pct">{Math.round(zoom * 100)}%</div>
      <button type="button" className="vs-zoom__fit" onClick={arrange} title="Auto-arrange nodes left-to-right">⤬ Arrange</button>
      <button type="button" className="vs-zoom__fit" onClick={() => fitView({ duration: 300 })}>⤢ Fit</button>
    </div>
  );
}

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  onEdgeUpdate: state.onEdgeUpdate,
  deleteEdge: state.deleteEdge,
});

export const PipelineUI = () => {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [menu, setMenu] = useState(null);
    const {
      nodes,
      edges,
      getNodeID,
      addNode,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onEdgeUpdate,
      deleteEdge,
    } = useStore(selector, shallow);
    const setView = useStore((s) => s.setView);

    // Track whether a reconnect landed on a valid handle. If the user drags an
    // edge end and drops it on empty space, we delete the edge instead.
    const edgeReconnected = useRef(true);
    const onEdgeUpdateStart = useCallback(() => { edgeReconnected.current = false; }, []);
    const handleEdgeUpdate = useCallback((oldEdge, newConnection) => {
      edgeReconnected.current = true;
      onEdgeUpdate(oldEdge, newConnection);
    }, [onEdgeUpdate]);
    const onEdgeUpdateEnd = useCallback((_event, edge) => {
      if (!edgeReconnected.current) deleteEdge(edge.id);
      edgeReconnected.current = true;
    }, [deleteEdge]);

    const getInitNodeData = (nodeID, type) => {
      let nodeData = { id: nodeID, nodeType: `${type}` };
      return nodeData;
    }

    const onDrop = useCallback(
        (event) => {
          event.preventDefault();
    
          const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
          if (event?.dataTransfer?.getData('application/reactflow')) {
            const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
            const type = appData?.nodeType;
      
            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
              return;
            }
      
            const position = reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            });

            const nodeID = getNodeID(type);
            const newNode = {
              id: nodeID,
              type,
              position,
              data: getInitNodeData(nodeID, type),
            };
      
            addNode(newNode);
          }
        },
        [reactFlowInstance, getNodeID, addNode]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        // Keep the menu on screen near the right/bottom edges.
        const left = Math.min(event.clientX - bounds.left, bounds.width - 168);
        const top = Math.min(event.clientY - bounds.top, bounds.height - 150);
        setMenu({ id: node.id, top, left });
    }, []);

    const closeMenu = useCallback(() => setMenu(null), []);

    // Dismiss the menu on any outside click or Escape.
    useEffect(() => {
        if (!menu) return;
        const onKey = (e) => e.key === 'Escape' && closeMenu();
        window.addEventListener('click', closeMenu);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('keydown', onKey);
        };
    }, [menu, closeMenu]);

    return (
        <div ref={reactFlowWrapper} className="vs-canvas">
            {nodes.length === 0 && (
                <div className="vs-empty">
                    <div className="vs-empty__plus" aria-hidden="true">+</div>
                    <p className="vs-empty__title">Drag a node onto the canvas to begin</p>
                    <p className="vs-empty__hint">Pick a node from the palette above</p>
                </div>
            )}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                edgesUpdatable
                onEdgeUpdateStart={onEdgeUpdateStart}
                onEdgeUpdate={handleEdgeUpdate}
                onEdgeUpdateEnd={onEdgeUpdateEnd}
                edgeUpdaterRadius={14}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                onNodeContextMenu={onNodeContextMenu}
                onPaneClick={closeMenu}
                onMoveStart={closeMenu}
                nodeTypes={nodeTypes}
                proOptions={proOptions}
                deleteKeyCode={['Delete', 'Backspace']}
                snapGrid={[gridSize, gridSize]}
                connectionLineType='step'
                defaultEdgeOptions={defaultEdgeOptions}
                connectionLineStyle={{ stroke: '#8B95A7', strokeWidth: 1.75 }}
                fitView
            >
                {/* Drafting sheet: a dot grid, like the wireframe canvas. */}
                <Background variant={BackgroundVariant.Dots} gap={gridSize} size={1.4} color="rgba(91,69,224,0.16)" />
                <Panel position="bottom-left"><ZoomPanel /></Panel>
                <Panel position="bottom-right">
                    <button
                        type="button"
                        className="vs-playground-fab"
                        onClick={() => setView('playground')}
                        title="Open Playground"
                        aria-label="Open Playground"
                    >
                        <span className="vs-playground-fab__icon" aria-hidden="true">▶</span>
                        <span className="vs-playground-fab__label">Playground</span>
                    </button>
                </Panel>
                <MiniMap
                    className="vs-minimap"
                    position="top-right"
                    style={{ width: 150, height: 100 }}
                    pannable
                    zoomable
                    maskColor="rgba(241, 243, 250, 0.62)"
                    nodeColor={(n) => categoryAccent(categoryForType(n.type))}
                    nodeBorderRadius={2}
                    nodeStrokeWidth={0}
                />
            </ReactFlow>
            {menu && <NodeContextMenu {...menu} onClose={closeMenu} />}
        </div>
    )
}
