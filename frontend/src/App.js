import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { RunActions } from './submit';
import { Nav } from './nav';
import { PipelineName } from './pipelineName';
import { RunInspector } from './inspector';
import { Playground } from './playground';
import { Pipelines } from './pipelines';
import { NodeCatalog } from './nodes/catalog';
import { Toaster, ConfirmDialog } from './feedback';

const selector = (state) => ({ view: state.view });

function App() {
  const { view } = useStore(selector, shallow);
  const showRun = view === 'editor';

  return (
    <div className="vs-app">
      <header className="vs-titleblock">
        <span className="vs-logo" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="4" cy="4" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <path d="M5.4 4.4h4.2a2 2 0 0 1 2 2v4" />
          </svg>
        </span>
        <div className="vs-crumb">
          <span className="vs-crumb__root">Pipelines</span>
          <span className="vs-crumb__sep">/</span>
          <PipelineName />
        </div>

        <div className="vs-titleblock__spacer" />
        <Nav />
        <div className="vs-titleblock__spacer" />

        {showRun && <RunActions />}
      </header>

      {view === 'editor' && (
        <div className="vs-workspace">
          <PipelineToolbar />
          <div className="vs-workspace__body">
            <PipelineUI />
            <RunInspector />
          </div>
        </div>
      )}
      {view === 'catalog' && <NodeCatalog />}
      {view === 'playground' && <Playground />}
      {view === 'pipelines' && <Pipelines />}

      <Toaster />
      <ConfirmDialog />
    </div>
  );
}

export default App;
