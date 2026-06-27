# VectorShift — Frontend Technical Assessment Checkpoint

## Overview

Frontend technical assessment for VectorShift. All necessary files live in the
`/frontend/src` and `/backend` folders. You may add, delete, or modify any
provided files, install new packages, and change any provided code.

- **Frontend:** JavaScript / React
- **Backend:** Python / FastAPI
- The assessment has **four parts** (read all parts before starting to plan your approach).
- Questions: recruiting@vectorshift.ai

### Running the project

| Component | Steps |
| --- | --- |
| Frontend | `cd /frontend` → `npm i` → `npm start` |
| Backend  | `cd /backend` → `uvicorn main:app --reload` |

---

## Part 1: Node Abstraction

`/frontend/src/nodes` contains JS files for four node types (**inputs, outputs,
LLMs, text**). Each node has different text, content, and input/output
connections (**Handles**), but shares significant code. Copy-pasting nodes
duplicates code and doesn't scale.

**Task:** Create an abstraction for these nodes that speeds up creating new
nodes and applying shared styles in the future.

- [ ] Design a reusable node abstraction
- [ ] Refactor the four existing nodes (inputs, outputs, LLMs, text) onto it
- [ ] Create **five new nodes** of your choosing to demonstrate the abstraction's flexibility/efficiency
  - Don't overthink what the nodes *do* — focus on showcasing the abstraction

---

## Part 2: Styling

The provided frontend has no significant styling.

**Task:** Style the components into an appealing, unified design.

- [ ] Apply a cohesive, unified visual design across all components
- [ ] (Optional) Use VectorShift's existing styles as inspiration, or design from scratch
- [ ] Any React packages/libraries are allowed

---

## Part 3: Text Node Logic

The Text node (`/frontend/src/nodes`) has a text input field to improve in two ways.

- [ ] **Auto-resize:** Text node width and height grow as the user types more text
- [ ] **Variable handles:** When the user enters a valid JS variable name wrapped
      in double curly brackets (e.g. `{{ input }}`), create a new **Handle** on
      the left side of the Text node corresponding to that variable

---

## Part 4: Backend Integration

A simple Python/FastAPI backend lives in `/backend`. Build an integration
between the completed frontend and this backend.

**Frontend (`/frontend/src/submit.js`):**

- [ ] On button click, send the pipeline's **nodes and edges** to the
      `/pipelines/parse` endpoint
- [ ] On response, show an **alert** displaying `num_nodes`, `num_edges`, and
      `is_dag` in a user-friendly manner

**Backend (`/backend/main.py`):**

- [ ] Update `/pipelines/parse` to calculate the number of nodes and edges
- [ ] Check whether the nodes and edges form a **directed acyclic graph (DAG)**
- [ ] Return the response in the format: `{num_nodes: int, num_edges: int, is_dag: bool}`

**End result:** A user can build a pipeline, click submit, and receive an alert
with the node/edge counts and whether the pipeline is a DAG.

---

## Final Checklist

- [ ] Part 1 — Node abstraction + 5 new demo nodes
- [ ] Part 2 — Unified styling
- [ ] Part 3 — Text node auto-resize + variable handles
- [ ] Part 4 — Frontend ↔ backend integration with DAG check + alert
