// fileUploadNode.js — a source that reads a text file (drag-drop or click) and
// emits its content. The backend treats a "file" as its text content, so this
// reads text files in-browser; pasting is tucked away as a fallback.

import { useRef, useState } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

const ACCEPT = '.txt,.md,.json,.csv,.log,.yaml,.yml,text/*,application/json';

const fmtSize = (n) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;

export const FileUploadNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const content = data?.content ?? '';
  const filename = data?.filename ?? '';

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateNodeField(id, 'filename', file.name);
      updateNodeField(id, 'content', String(reader.result ?? ''));
    };
    reader.readAsText(file);
  };

  const onPick = (e) => { readFile(e.target.files?.[0]); e.target.value = ''; };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files?.[0]); };
  const clear = () => { updateNodeField(id, 'filename', ''); updateNodeField(id, 'content', ''); };

  return (
    <BaseNode
      id={id}
      data={data}
      category="source"
      title="File upload"
      width={252}
      outputs={[{ id: `${id}-content`, label: 'content' }]}
    >
      {filename ? (
        <div className="vs-file__chip">
          <span className="vs-file__chip-icon" aria-hidden="true">▤</span>
          <span className="vs-file__chip-name" title={filename}>{filename}</span>
          <span className="vs-file__chip-size">{fmtSize(content.length)}</span>
          <button type="button" className="vs-file__chip-x nodrag" onClick={clear} aria-label="Remove file">×</button>
        </div>
      ) : (
        <div
          className={`vs-drop nodrag${drag ? ' vs-drop--active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <span className="vs-drop__icon" aria-hidden="true">⬆</span>
          <span className="vs-drop__title">Click or drop a file</span>
          <span className="vs-drop__hint">txt · md · json · csv · yaml</span>
        </div>
      )}

      <input ref={inputRef} type="file" className="vs-file__input" accept={ACCEPT} onChange={onPick} />

      <details className="vs-file__paste">
        <summary className="vs-file__paste-toggle nodrag">
          {filename ? 'view / edit content' : 'or paste text'}
        </summary>
        <textarea
          className="vs-field__input vs-field__textarea nodrag nowheel"
          rows={3}
          value={content}
          placeholder="Paste file contents…"
          onChange={(e) => updateNodeField(id, 'content', e.target.value)}
        />
      </details>
    </BaseNode>
  );
};
