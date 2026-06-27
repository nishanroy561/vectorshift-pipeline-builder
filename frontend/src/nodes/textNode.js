// textNode.js
// --------------------------------------------------
// Built on BaseNode like every other node, but with two custom behaviors:
//   1. the card grows with its content (width from the longest line, height
//      from the textarea's scroll height)
//   2. any `{{ variable }}` written in the text becomes a labeled input port
//      on the left, so upstream nodes can feed that variable.

import { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';

// Matches a valid JS identifier wrapped in double curly braces: {{ name }}
const VARIABLE_RE = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

const extractVariables = (text) => {
  const seen = new Set();
  const vars = [];
  let match;
  while ((match = VARIABLE_RE.exec(text)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      vars.push(match[1]);
    }
  }
  return vars;
};

export const TextNode = ({ id, data }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const edges = useStore((state) => state.edges);
  const nodes = useStore((state) => state.nodes);
  const [text, setText] = useState(data?.text ?? '{{ input }}');
  const textareaRef = useRef(null);

  // Seed the store once so a submit captures the initial text too.
  useEffect(() => {
    updateNodeField(id, 'text', text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setText(e.target.value);
    updateNodeField(id, 'text', e.target.value);
  };

  const variables = useMemo(() => extractVariables(text), [text]);

  // A {{ variable }} is satisfied if EITHER a wire feeds its handle OR an Input
  // node is named the same (name-based binding, matching the backend). Only the
  // truly-dangling ones get flagged as literal text.
  const portOf = (handle) => {
    if (!handle) return '';
    const prefix = `${id}-`;
    return handle.startsWith(prefix) ? handle.slice(prefix.length) : handle;
  };
  const inputNames = new Set(
    nodes
      .filter((n) => n.type === 'customInput')
      .map((n) => n.data?.inputName || n.id.replace('customInput-', 'input_'))
  );
  const isConnected = (name) =>
    inputNames.has(name) ||
    edges.some((e) => e.target === id && portOf(e.targetHandle) === name);
  const inputs = variables.map((name) => ({
    id: `${id}-${name}`,
    label: name,
    warn: !isConnected(name),
  }));
  const unconnected = variables.filter((name) => !isConnected(name));

  // Width follows the longest line; height follows the textarea content.
  const width = useMemo(() => {
    const longest = text.split('\n').reduce((max, line) => Math.max(max, line.length), 8);
    return Math.min(460, Math.max(220, longest * 8 + 56));
  }, [text]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text, width]);

  return (
    <BaseNode
      id={id}
      data={data}
      category="data"
      title="Text"
      width={width}
      inputs={inputs}
      outputs={[{ id: `${id}-output`, label: 'output' }]}
      footer={
        variables.length === 0
          ? undefined
          : unconnected.length > 0
          ? `⚠ ${unconnected.length} unconnected: ${unconnected.join(', ')}`
          : `${variables.length} variable${variables.length > 1 ? 's' : ''} connected`
      }
      footerWarn={unconnected.length > 0}
    >
      <label className="vs-field">
        <span className="vs-field__label">Text</span>
        <textarea
          ref={textareaRef}
          className="vs-field__input vs-field__textarea"
          value={text}
          onChange={handleChange}
          rows={1}
          placeholder="Write text, use {{ variable }} for inputs…"
          spellCheck={false}
        />
      </label>
    </BaseNode>
  );
};
