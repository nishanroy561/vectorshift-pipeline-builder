// pipelineName.js — the current pipeline's filename in the title block.
// Double-click to rename; Enter/blur commits, Escape cancels.

import { useState, useRef, useEffect } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

const selector = (s) => ({ pipelineName: s.pipelineName, setPipelineName: s.setPipelineName });

export const PipelineName = () => {
  const { pipelineName, setPipelineName } = useStore(selector, shallow);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pipelineName);
  const inputRef = useRef(null);

  // Keep the draft in sync when the name changes elsewhere (load / new).
  useEffect(() => {
    if (!editing) setDraft(pipelineName);
  }, [pipelineName, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setPipelineName(draft.trim() || 'Untitled pipeline');
    setEditing(false);
  };

  const cancel = () => {
    setDraft(pipelineName);
    setEditing(false);
  };

  return (
    <div className="vs-filename" title="Double-click to rename">
      {editing ? (
        <input
          ref={inputRef}
          className="vs-filename__input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
        />
      ) : (
        <>
          <span className="vs-filename__text" onDoubleClick={() => setEditing(true)}>
            {pipelineName}
          </span>
          <button type="button" className="vs-filename__edit" onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
  );
};
