# engine.py
# --------------------------------------------------
# The pipeline runtime. Given the graph the frontend draws, it:
#   1. confirms the graph is a runnable DAG,
#   2. topologically sorts the nodes,
#   3. executes each node, feeding its outputs into downstream inputs via edges.
#
# Each node's outputs are keyed by *port name* (the handle id minus the node-id
# prefix, e.g. handle "llm-1-response" -> port "response"). Edges connect a
# source port on one node to a target port on another, which is how a value
# travels from one node to the next.

import hashlib
import json
import math
from collections import defaultdict, deque

import httpx

from providers import chat_completion, embed_text, ProviderError

# Matches {{ variable }} in Text nodes — same rule the frontend uses.
import re
VARIABLE_RE = re.compile(r"\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}")


def _port(handle: str, node_id: str) -> str:
    """Strip the '<node_id>-' prefix from a handle id to get the bare port name."""
    prefix = f"{node_id}-"
    return handle[len(prefix):] if handle and handle.startswith(prefix) else handle


def topological_order(node_ids: set[str], edges: list[dict]) -> list[str] | None:
    """Kahn's algorithm. Returns nodes in run order, or None if there's a cycle."""
    adjacency = defaultdict(list)
    indegree = {nid: 0 for nid in node_ids}
    for e in edges:
        s, t = e.get("source"), e.get("target")
        if s in node_ids and t in node_ids:
            adjacency[s].append(t)
            indegree[t] += 1

    queue = deque(nid for nid, d in indegree.items() if d == 0)
    order = []
    while queue:
        cur = queue.popleft()
        order.append(cur)
        for nxt in adjacency[cur]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return order if len(order) == len(node_ids) else None


# ---- Node executors ------------------------------------------------------
# Each takes (node_data, inputs, secrets) and returns {output_port: value}.

async def _run_input(data, inputs, secrets):
    value = data.get("value", "")
    # Type "Number" coerces the text value to a real number for downstream math.
    if data.get("inputType") == "Number":
        try:
            num = float(value)
            value = int(num) if num.is_integer() else num
        except (TypeError, ValueError):
            pass
    return {"value": value}


async def _run_text(data, inputs, secrets):
    text = data.get("text", "")
    filled = VARIABLE_RE.sub(
        lambda m: str(inputs.get(m.group(1), m.group(0))), text
    )
    return {"output": filled}


async def _run_llm(data, inputs, secrets):
    provider = data.get("provider", "groq")
    model = data.get("model") or "llama-3.3-70b-versatile"
    temperature = float(data.get("temperature", 0.7))
    # The key is entered on the LLM node itself; fall back to any global secret.
    api_key = (data.get("apiKey") or "").strip() or (secrets or {}).get(provider, "")

    messages = []
    system = inputs.get("system") or data.get("system")
    if system:
        messages.append({"role": "system", "content": str(system)})

    # The `context` input lets upstream nodes (a Knowledge base, Vector store, or
    # a Mongo "find" of past responses) feed retrieved/remembered material in.
    context = inputs.get("context")
    if context:
        if isinstance(context, list):
            context = "\n".join(str(c) for c in context)
        elif isinstance(context, dict):
            context = json.dumps(context, ensure_ascii=False, indent=2)
        messages.append({
            "role": "system",
            "content": f"Context to use when answering:\n{context}",
        })

    prompt = inputs.get("prompt") or data.get("prompt") or ""
    messages.append({"role": "user", "content": str(prompt)})

    response = await chat_completion(provider, model, messages, api_key, temperature)
    return {"response": response}


async def _run_math(data, inputs, secrets):
    def num(x):
        try:
            return float(x)
        except (TypeError, ValueError):
            return 0.0
    a, b = num(inputs.get("a")), num(inputs.get("b"))
    op = data.get("operation", "add")
    result = {
        "add": a + b,
        "subtract": a - b,
        "multiply": a * b,
        "divide": a / b if b != 0 else float("nan"),
    }.get(op, a + b)
    return {"result": result}


async def _run_filter(data, inputs, secrets):
    items = inputs.get("in")
    predicate = (data.get("predicate") or "True").strip()
    # Fail fast on a malformed predicate instead of silently dropping everything.
    try:
        code = compile(predicate, "<filter>", "eval")
    except SyntaxError as exc:
        raise ValueError(
            f"Filter predicate is invalid: {exc}. Use a boolean expression, e.g. item.score > 0.5."
        ) from exc
    if not isinstance(items, list):
        # Nothing list-like to filter — pass the value straight through.
        return {"out": items}
    kept = []
    for item in items:
        try:
            if eval(code, {"__builtins__": {}}, {**_SAFE, "item": item}):  # noqa: S307
                kept.append(item)
        except Exception:
            continue
    return {"out": kept}


async def _run_api(data, inputs, secrets):
    method = (data.get("method") or "GET").upper()
    url = data.get("url", "")
    if not url:
        return {"response": None}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(method, url)
    try:
        return {"response": resp.json()}
    except Exception:
        return {"response": resp.text}


async def _run_condition(data, inputs, secrets):
    value = inputs.get("value")
    test = (data.get("test") or "True").strip()
    try:
        passed = bool(eval(test, {"__builtins__": {}}, {**_SAFE, "value": value}))  # noqa: S307
    except Exception as exc:
        # Don't silently treat a broken test as False — that hides the mistake
        # and sends the value down the wrong branch. Surface it so the user
        # fixes the syntax (use "==" not "=", no assignment).
        raise ValueError(
            f'Condition test is invalid: {exc}. Use a comparison, e.g. value == "POSITIVE".'
        ) from exc
    # The branch not taken emits nothing.
    return {"true": value if passed else None, "false": None if passed else value}


async def _run_output(data, inputs, secrets):
    return {"value": inputs.get("value")}


async def _run_note(data, inputs, secrets):
    return {}


# ---- Embedding helpers ---------------------------------------------------
# A small, dependency-free, deterministic embedding so Embedder / Vector store
# work offline. Tokens are hashed into a fixed-dim bag, then L2-normalized.

def _embed(text, dim=64):
    vec = [0.0] * dim
    for tok in str(text or "").lower().split():
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % dim] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def _cosine(a, b):
    return sum(x * y for x, y in zip(a, b))


# A conservative namespace for the Transform node's expression eval.
_SAFE = {
    "len": len, "str": str, "int": int, "float": float, "bool": bool,
    "sum": sum, "min": min, "max": max, "abs": abs, "round": round,
    "sorted": sorted, "list": list, "dict": dict, "set": set, "tuple": tuple,
    "any": any, "all": all, "map": map, "filter": filter, "range": range,
}


async def _run_file(data, inputs, secrets):
    # A "file" is its pasted text content; the browser supplies it on the node.
    return {"content": data.get("content", ""), "filename": data.get("filename", "")}


async def _run_embedder(data, inputs, secrets):
    text = inputs.get("text")
    if text is None:
        text = data.get("text", "")
    provider = (data.get("provider") or "local").strip()
    # "local" is the offline, dependency-free embedder; anything else calls a
    # real embedding API with the node's key (or a matching global secret).
    if provider == "local":
        return {"embedding": _embed(text)}
    model = data.get("model") or ""
    api_key = (data.get("apiKey") or "").strip() or (secrets or {}).get(provider, "")
    vector = await embed_text(provider, model, str(text or ""), api_key)
    return {"embedding": vector}


async def _run_transform(data, inputs, secrets):
    expr = data.get("expr") or "value"
    try:
        result = eval(expr, {"__builtins__": {}}, {**_SAFE, "value": inputs.get("value")})  # noqa: S307
    except Exception as exc:  # surface the expression error to the user
        raise ValueError(f"Transform error: {exc}") from exc
    return {"result": result}


async def _run_display(data, inputs, secrets):
    return {"value": inputs.get("value")}


async def _run_kb(data, inputs, secrets):
    """Lexical retrieval: rank documents by word overlap with the query."""
    query = str(inputs.get("query") or "")
    docs = [d.strip() for d in (data.get("documents") or "").splitlines() if d.strip()]
    top_k = int(data.get("topK") or 3)
    terms = set(query.lower().split())
    ranked = sorted(docs, key=lambda d: len(terms & set(d.lower().split())), reverse=True)
    return {"context": "\n".join(ranked[:top_k])}


async def _run_vector(data, inputs, secrets):
    """Semantic retrieval: rank documents by cosine similarity to the query."""
    query = str(inputs.get("query") or "")
    docs = [d.strip() for d in (data.get("documents") or "").splitlines() if d.strip()]
    top_k = int(data.get("topK") or 3)
    qv = _embed(query)
    ranked = sorted(docs, key=lambda d: _cosine(qv, _embed(d)), reverse=True)
    return {"matches": ranked[:top_k]}


async def _run_mongo(data, inputs, secrets):
    """Find or insert against MongoDB using the async motor driver."""
    uri = (data.get("uri") or "").strip()
    if not uri:
        raise ValueError("MongoDB node needs a connection URI.")
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
    except ImportError as exc:
        raise RuntimeError("motor is not installed. Run: pip install motor") from exc

    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=4000)
    col = client[data.get("database") or "test"][data.get("collection") or "documents"]
    mode = data.get("mode") or "find"

    # The incoming `record` is the document to write (insert/update/upsert).
    def as_doc(value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return {"value": value}
        return value if isinstance(value, dict) else {"value": value}

    # The Query (JSON) field is the filter for find/update/upsert/delete.
    def as_query():
        try:
            return json.loads(data.get("query") or "{}")
        except json.JSONDecodeError:
            return {}

    if mode == "insertOne":
        res = await col.insert_one(as_doc(inputs.get("record")))
        return {"result": {"insertedId": str(res.inserted_id)}}

    if mode in ("updateOne", "upsert"):
        record = as_doc(inputs.get("record"))
        # Allow raw update operators ($set, $inc…); otherwise wrap in $set.
        update = record if any(k.startswith("$") for k in record) else {"$set": record}
        res = await col.update_one(as_query(), update, upsert=(mode == "upsert"))
        return {"result": {
            "matched": res.matched_count,
            "modified": res.modified_count,
            "upsertedId": str(res.upserted_id) if res.upserted_id else None,
        }}

    if mode == "deleteOne":
        res = await col.delete_one(as_query())
        return {"result": {"deleted": res.deleted_count}}

    # Default: find.
    docs = await col.find(as_query()).to_list(length=int(data.get("limit") or 5))
    for doc in docs:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
    return {"result": docs}


async def _run_loop(data, inputs, secrets):
    """Bound an upstream list to a maximum number of items."""
    items = inputs.get("in")
    seq = items if isinstance(items, list) else ([] if items is None else [items])
    seq = seq[: int(data.get("limit") or 10)]
    return {"items": seq, "count": len(seq)}


async def _run_merge(data, inputs, secrets):
    """Combine two inputs: concat lists, merge dicts, else join."""
    a, b = inputs.get("a"), inputs.get("b")
    if isinstance(a, list) or isinstance(b, list):
        la = a if isinstance(a, list) else ([] if a is None else [a])
        lb = b if isinstance(b, list) else ([] if b is None else [b])
        return {"merged": la + lb}
    if isinstance(a, dict) and isinstance(b, dict):
        return {"merged": {**a, **b}}
    if a is None:
        return {"merged": b}
    if b is None:
        return {"merged": a}
    return {"merged": f"{a}{b}"}


EXECUTORS = {
    "customInput": _run_input,
    "fileInput": _run_file,
    "text": _run_text,
    "llm": _run_llm,
    "embedder": _run_embedder,
    "transform": _run_transform,
    "math": _run_math,
    "filter": _run_filter,
    "api": _run_api,
    "condition": _run_condition,
    "loop": _run_loop,
    "merge": _run_merge,
    "knowledgeBase": _run_kb,
    "vectorStore": _run_vector,
    "mongo": _run_mongo,
    "customOutput": _run_output,
    "display": _run_display,
    "note": _run_note,
}


async def run_pipeline(nodes: list[dict], edges: list[dict], secrets: dict) -> dict:
    """Execute the pipeline and return per-node outputs + collected results."""
    node_map = {n["id"]: n for n in nodes}
    node_ids = set(node_map)

    order = topological_order(node_ids, edges)
    if order is None:
        return {
            "ok": False,
            "error": "Pipeline has a cycle — it must be a DAG to run.",
            "outputs": {}, "node_results": {}, "errors": [],
        }

    # incoming[target_id] = list of (target_port, source_id, source_port)
    incoming = defaultdict(list)
    for e in edges:
        s, t = e.get("source"), e.get("target")
        if s in node_ids and t in node_ids:
            incoming[t].append((
                _port(e.get("targetHandle", ""), t),
                s,
                _port(e.get("sourceHandle", ""), s),
            ))

    # Map each Input node's *name* to its value, so a Text node's {{ name }} can
    # resolve by name even without an explicit wire (a wired value still wins).
    named_values: dict[str, str] = {}
    for node in node_map.values():
        if node.get("type") == "customInput":
            d = node.get("data", {})
            name = d.get("inputName") or str(node["id"]).replace("customInput-", "input_")
            named_values[name] = d.get("value", "")

    outputs: dict[str, dict] = {}      # node_id -> {port: value}
    node_results: dict[str, dict] = {} # node_id -> {status, output/error}
    errors: list[str] = []

    for node_id in order:
        node = node_map[node_id]
        ntype = node.get("type")
        executor = EXECUTORS.get(ntype)
        if executor is None:
            node_results[node_id] = {"status": "skipped", "reason": f"no executor for '{ntype}'"}
            outputs[node_id] = {}
            continue

        # Gather inputs from upstream node outputs.
        node_inputs = {}
        for target_port, src_id, src_port in incoming.get(node_id, []):
            node_inputs[target_port] = outputs.get(src_id, {}).get(src_port)

        # Text nodes also resolve {{ name }} against Input names by default,
        # without needing a wire. An explicit wire (above) takes precedence.
        if ntype == "text":
            for name, value in named_values.items():
                node_inputs.setdefault(name, value)

        try:
            result = await executor(node.get("data", {}), node_inputs, secrets)
            outputs[node_id] = result
            node_results[node_id] = {"status": "ok", "output": result}
        except ProviderError as exc:
            outputs[node_id] = {}
            node_results[node_id] = {"status": "error", "error": str(exc)}
            errors.append(f"{node_id}: {exc}")
        except Exception as exc:
            outputs[node_id] = {}
            node_results[node_id] = {"status": "error", "error": str(exc)}
            errors.append(f"{node_id}: {exc}")

    # Collected results = the value at each Output node.
    results = {
        nid: outputs.get(nid, {}).get("value")
        for nid, n in node_map.items()
        if n.get("type") == "customOutput"
    }

    return {
        "ok": len(errors) == 0,
        "results": results,
        "outputs": outputs,
        "node_results": node_results,
        "errors": errors,
    }
