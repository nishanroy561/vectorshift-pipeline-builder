# VectorShift — Frontend Technical Assessment

A full-stack pipeline builder with a drag-and-drop node editor, real-time DAG validation, and an LLM execution engine. Built with **React + ReactFlow** (frontend) and **Python + FastAPI** (backend).

![Pipeline Editor](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 16 and **npm**
- **Python** ≥ 3.10
- **MongoDB Atlas** cluster (free tier works) — [create one here](https://www.mongodb.com/cloud/atlas)

### 1. Clone & set up environment variables

```bash
git clone <repo-url>
cd frontend_technical_assessment
```

**Backend** — create `backend/.env` from the template:

```bash
cp backend/.env.example backend/.env
```

Then fill in your MongoDB connection string:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<app>
```

**Frontend** — create `frontend/.env` from the template (optional — defaults to `localhost:8000`):

```bash
cp frontend/.env.example frontend/.env
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Verify with: `curl http://localhost:8000/` → `{"Ping": "Pong"}`

### 3. Start the frontend

```bash
cd frontend
npm install
npm start
```

The app opens at `http://localhost:3000`.

---

## Project Structure

```
├── frontend/                   # React app (Create React App)
│   ├── src/
│   │   ├── nodes/              # Node components + abstraction layer
│   │   │   ├── BaseNode.js     # Core node abstraction (Part 1)
│   │   │   ├── fields.js       # Reusable field system
│   │   │   ├── nodeTheme.js    # Category-based theming
│   │   │   ├── nodeCatalog.js  # Node registry & metadata
│   │   │   ├── textNode.js     # Text node with dynamic sizing (Part 3)
│   │   │   └── ...             # 14+ node types
│   │   ├── store.js            # Zustand state management
│   │   ├── submit.js           # Pipeline validation & execution (Part 4)
│   │   ├── index.css           # Full design system (Part 2)
│   │   └── ...
│   ├── .env.example            # Frontend env template
│   └── package.json
├── backend/                    # FastAPI server
│   ├── main.py                 # API endpoints (parse, run, CRUD)
│   ├── engine.py               # Pipeline execution engine
│   ├── db.py                   # MongoDB connection (Motor async)
│   ├── providers.py            # LLM provider integrations
│   ├── .env.example            # Backend env template
│   └── requirements.txt
└── README.md
```

---

## Assessment Parts

### Part 1 — Node Abstraction

All nodes extend a single [`BaseNode`](frontend/src/nodes/BaseNode.js) component that handles shared chrome (header, ports, fields, actions, run results). New nodes are created in **10–30 lines** by declaring only what differs:

```jsx
export const FilterNode = ({ id, data }) => (
  <BaseNode
    id={id} data={data}
    category="data" title="Filter"
    inputs={[{ id: `${id}-in`, label: 'in' }]}
    outputs={[{ id: `${id}-out`, label: 'out' }]}
    fields={[{ key: 'predicate', label: 'Predicate', type: 'text', default: 'item.score > 0.8' }]}
  />
);
```

**14 new node types** built on this abstraction (5 were required): Filter, Math, API Request, Condition, Note, File Upload, Embedder, Transform, Display, Knowledge Base, Vector Store, MongoDB, Loop, Merge.

### Part 2 — Styling

A complete 1,400+ line [design system](frontend/src/index.css) with:
- Custom typography (Space Grotesk, Hanken Grotesk, JetBrains Mono)
- Category-colored node spines (source/compute/data/logic/sink)
- Smooth transitions, hover effects, and micro-animations
- Responsive layout with sidebar, toolbar, and canvas

### Part 3 — Text Node Logic

[`TextNode`](frontend/src/nodes/textNode.js) implements:
- **Dynamic sizing** — width grows with the longest line, height auto-expands with textarea scroll height
- **Variable extraction** — `{{ variableName }}` creates a labeled input Handle on the left side using a regex that validates JS identifier syntax

### Part 4 — Backend Integration

- [`submit.js`](frontend/src/submit.js): "Check pipeline" button sends `{ nodes, edges }` to `/pipelines/parse`
- [`main.py`](backend/main.py): Endpoint returns `{ num_nodes, num_edges, is_dag }` using Kahn's algorithm
- A toast notification displays the results in a user-friendly format

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend API base URL (no trailing slash) |

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `MONGO_URI` | *(required)* | MongoDB connection string |
| `MONGO_DB` | `vectorshift` | Database name |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |

---

## Features Beyond the Assessment

- **Pipeline execution engine** — run pipelines end-to-end with real LLM calls (Groq, OpenRouter)
- **Pipeline persistence** — save/load pipelines to MongoDB Atlas
- **Export / Import** — download pipelines as JSON, import them back
- **Node catalog gallery** — visual parts-bin with categories
- **Auto-layout** — Kahn's-algorithm-based left-to-right arrangement
- **Run inspector** — click a node after a run to see its output
- **Playground mode** — fill inputs and view outputs in a split-pane view
