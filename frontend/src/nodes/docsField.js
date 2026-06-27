// docsField.js — shared "documents + Top K" body for the Knowledge base and
// Vector store nodes. Documents can be pasted OR loaded from a text file
// (one document per line); the file's lines are appended to whatever is there.

import { useRef, useState } from 'react';
import { useStore } from '../store';

export const DocsField = ({ nodeId }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const data = useStore((s) => s.nodes.find((n) => n.id === nodeId)?.data);
  const docs = data?.documents ?? '';
  const topK = data?.topK ?? 3;
  const fileRef = useRef(null);
  const [drag, setDrag] = useState(false);

  // Append a text file's lines below whatever's already in the box.
  const appendFromFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '').trim();
      const merged = docs.trim() ? `${docs.replace(/\s+$/, '')}\n${text}` : text;
      updateNodeField(nodeId, 'documents', merged);
    };
    reader.readAsText(file);
  };

  const onPick = (e) => { appendFromFile(e.target.files?.[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); appendFromFile(e.dataTransfer.files?.[0]); };

  const count = docs.split('\n').filter((l) => l.trim()).length;

  return (
    <>
      <label className="vs-field">
        <span className="vs-field__label vs-field__label--row">
          <span>Documents</span>
          <button
            type="button"
            className="vs-docs__load nodrag"
            title="Import documents from a text file (.txt, .md, .csv) — one line becomes one document, appended below."
            onClick={() => fileRef.current?.click()}
          >
            ⬆ Upload
          </button>
        </span>
        <textarea
          className={`vs-field__input vs-field__textarea nodrag nowheel${drag ? ' vs-field__textarea--drop' : ''}`}
          rows={3}
          value={docs}
          placeholder={drag ? 'Drop file to add documents…' : 'Paste documents, one per line — or drop a file'}
          onChange={(e) => updateNodeField(nodeId, 'documents', e.target.value)}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        />
        <span className="vs-docs__count">{count} document{count === 1 ? '' : 's'}</span>
      </label>
      <input
        ref={fileRef}
        type="file"
        className="vs-file__input"
        accept=".txt,.md,.csv,.log,text/*"
        onChange={onPick}
      />
      <label className="vs-field" title="How many of the best-matching documents to return for the incoming query.">
        <span className="vs-field__label">Top K</span>
        <input
          className="vs-field__input"
          type="number"
          min={1}
          value={topK}
          onChange={(e) => updateNodeField(nodeId, 'topK', e.target.value)}
        />
      </label>
    </>
  );
};
