// pipelineStorage.js — saved pipelines, persisted in MongoDB via the backend.

const BASE = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/pipelines`;

const asError = async (res) => {
  let detail = `Server responded ${res.status}`;
  try {
    const body = await res.json();
    if (body?.detail) detail = body.detail;
  } catch { /* ignore */ }
  return new Error(detail);
};

// All saved pipelines, newest first.
export const listPipelines = async () => {
  const res = await fetch(BASE);
  if (!res.ok) throw await asError(res);
  return res.json();
};

// Create or update a pipeline; the backend returns the stored record.
export const savePipeline = async (pipeline) => {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
  });
  if (!res.ok) throw await asError(res);
  return res.json();
};

export const deletePipeline = async (id) => {
  const res = await fetch(`${BASE}/item/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw await asError(res);
  return res.json();
};
