// nav.js — the view switch in the title block.

import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const TABS = [
  { id: 'editor', label: 'Pipeline' },
  { id: 'catalog', label: 'Node Catalog' },
  { id: 'playground', label: 'Playground' },
  { id: 'pipelines', label: 'My pipelines' },
];

const selector = (state) => ({ view: state.view, setView: state.setView });

export const Nav = () => {
  const { view, setView } = useStore(selector, shallow);
  return (
    <nav className="vs-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`vs-nav__tab${view === tab.id ? ' vs-nav__tab--active' : ''}`}
          onClick={() => setView(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
