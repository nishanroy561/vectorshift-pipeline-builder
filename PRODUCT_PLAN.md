# VectorShift Pipeline Builder — Product Plan

Turning the assessment into a fully functional, runnable pipeline product.

## Vision

A visual workflow builder where a user drags nodes, wires them together, pastes
their own LLM API key (Groq / OpenRouter), clicks **Run**, and the pipeline
**actually executes** — LLM calls happen, text templates fill, data flows node to
node, and results appear on the Output nodes. Pipelines and run history are saved
in MongoDB.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + ReactFlow + Zustand (existing) |
| Backend | Python + FastAPI (existing) |
| LLM providers | **Groq** + **OpenRouter** (both OpenAI-compatible → one client) |
| API keys | **BYOK** — pasted in UI, stored in browser localStorage, sent per-run |
| Database | **MongoDB** (via `motor` async driver) — stores pipelines + run history |
| HTTP | `httpx` (provider calls + the API node) |

## Key design decisions

1. **One provider client for both.** Groq (`https://api.groq.com/openai/v1`) and
   OpenRouter (`https://openrouter.ai/api/v1`) both speak the OpenAI chat format.
   A single `chat_completion(provider, model, messages, key, temperature)` covers both.
2. **Secrets never touch the database.** Keys live in the browser, travel in the
   run request body over HTTPS, are used transiently, and are never logged or
   persisted. MongoDB stores pipelines and runs only. *(Override: encrypt-at-rest
   in DB if you'd rather — needs auth + a server-side encryption key.)*
3. **Execution = topological walk of the DAG.** Sort nodes, run each one, map its
   outputs (keyed by output-handle id) into downstream nodes' inputs (keyed by
   input-handle id, via the edges).

---

## Phase 1 — Execution Engine ✅ DONE

Backend `engine.py` + `providers.py` + `POST /pipelines/run` built and verified
(text templating, math, and clean no-key LLM errors all confirmed via live
requests). Frontend Run button, Settings/API-keys modal (BYOK → localStorage),
LLM provider/model/temperature fields, Input `value` field, and on-node result
strips all added; `npm run build` passes. LLM calls work once a Groq/OpenRouter
key is pasted in Settings.

### Original spec (for reference)
### Phase 1 — Execution Engine (the core; makes it a real product)

**Backend**
- `requirements.txt` → add `motor`, `httpx`, `python-dotenv`
- `providers.py` → `chat_completion(provider, model, messages, api_key, temperature)`
  for Groq + OpenRouter
- `engine.py` → topological sort + per-node executors:
  - **Input** → emits its configured value
  - **Text** → fills `{{ variables }}` from connected inputs
  - **LLM** → builds messages from `system`/`prompt` inputs, calls provider, returns `response`
  - **Math** → `a ⊕ b` (add/sub/mul/div)
  - **Filter** → applies predicate to a list input
  - **API** → real HTTP request, returns response body
  - **Condition** → evaluates test, routes value to `true`/`false` output
  - **Output** → collects final result
- `main.py` → new `POST /pipelines/run` (keeps existing `/pipelines/parse`).
  Request: `{ nodes, edges, secrets: { groq, openrouter } }`.
  Response: `{ outputs: {nodeId: value}, node_results: {...}, errors: [...] }`.

**Frontend**
- **Run** button next to "Check pipeline" → POST to `/pipelines/run`
- **Settings panel** (gear icon) → paste Groq / OpenRouter keys → localStorage
- **LLM node** → add **provider** dropdown (Groq / OpenRouter) + model field
- **Input node** → add a runtime **value** field (what it emits)
- Results shown in an alert/result panel first (on-node display comes in Phase 4)

**Done when:** Input("Hello") → LLM → Output runs and the Output shows a real
model response.

## Phase 2 — Persistence (MongoDB)
- Mongo connection (`db.py`), `MONGODB_URI` env var (local or Atlas free tier)
- Collections: `pipelines`, `runs`
- Endpoints: save / list / load / delete pipelines; auto-save each run to history
- Frontend: Save / Load / "My pipelines" UI; pipeline name field

## Phase 3 — Secrets & settings polish
- Per-provider key management UI, "test key" button
- Model lists per provider (presets + free-text)
- Validation + helpful errors when a key is missing

## Phase 4 — Live run UX
- Stream execution via SSE: nodes show running / done / error states
- Display each node's output inline on the node
- Run timeline / logs panel

## Phase 5 — Auth + deploy
- User accounts (so pipelines are per-user); optional encrypted key storage in DB
- Deploy: backend (Render/Fly/Railway) + frontend (Vercel/Netlify) + Mongo Atlas

---

## Build order
Phase 1 first — it's the line between "diagram tool" and "product." Each later
phase is independently shippable.
