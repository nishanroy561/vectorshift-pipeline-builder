import os
import time
from collections import defaultdict, deque
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

from engine import run_pipeline
from db import pipelines_collection

app = FastAPI()

# CORS origins: read from CORS_ORIGINS env var (comma-separated) or fall back
# to localhost defaults for local development.
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_env_origins = os.getenv("CORS_ORIGINS", "").strip()
_origins = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    # Also allow any *.vercel.app deployment (production, -inky alias, previews)
    # so the hosted frontend works without pinning an exact origin.
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    id: str


class Edge(BaseModel):
    source: str
    target: str


class Pipeline(BaseModel):
    nodes: list[Node]
    edges: list[Edge]


# For running, nodes carry their type + config data and edges carry handle ids,
# so we accept the raw graph shape the frontend sends rather than a strict model.
class RunRequest(BaseModel):
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    secrets: dict[str, str] = Field(default_factory=dict)


# A saved pipeline as persisted in MongoDB.
class SavedPipeline(BaseModel):
    id: str | None = None
    name: str = "Untitled pipeline"
    status: str = "Draft"
    updatedAt: int | None = None
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


def is_dag(nodes: list[Node], edges: list[Edge]) -> bool:
    """Return True if the directed graph has no cycles (Kahn's algorithm)."""
    node_ids = {node.id for node in nodes}
    adjacency = defaultdict(list)
    indegree = {node_id: 0 for node_id in node_ids}

    for edge in edges:
        # Ignore edges that reference nodes not in the pipeline.
        if edge.source in node_ids and edge.target in node_ids:
            adjacency[edge.source].append(edge.target)
            indegree[edge.target] += 1

    queue = deque(node_id for node_id, deg in indegree.items() if deg == 0)
    visited = 0

    while queue:
        current = queue.popleft()
        visited += 1
        for neighbor in adjacency[current]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)

    # If every node was processed, no cycle remained.
    return visited == len(node_ids)


@app.get('/')
def read_root():
    return {'Ping': 'Pong'}


@app.post('/pipelines/parse')
def parse_pipeline(pipeline: Pipeline):
    return {
        'num_nodes': len(pipeline.nodes),
        'num_edges': len(pipeline.edges),
        'is_dag': is_dag(pipeline.nodes, pipeline.edges),
    }


@app.post('/pipelines/run')
async def run(request: RunRequest):
    """Execute the pipeline end-to-end and return per-node outputs + results."""
    return await run_pipeline(request.nodes, request.edges, request.secrets)


# ---- Saved pipelines: CRUD backed by MongoDB ----------------------------

def _db_error(exc: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail=f"Database unavailable: {exc}")


@app.get('/pipelines')
async def list_pipelines():
    """All saved pipelines, newest first."""
    try:
        col = pipelines_collection()
        return await col.find({}, {'_id': 0}).sort('updatedAt', -1).to_list(length=500)
    except (PyMongoError, RuntimeError) as exc:
        raise _db_error(exc)


@app.post('/pipelines')
async def save_pipeline(pipeline: SavedPipeline):
    """Create or update (upsert) a pipeline, keyed by its id."""
    doc = pipeline.model_dump()
    if not doc.get('id'):
        doc['id'] = f"pl_{int(time.time() * 1000)}"
    doc['updatedAt'] = int(time.time() * 1000)
    try:
        col = pipelines_collection()
        await col.update_one({'id': doc['id']}, {'$set': doc}, upsert=True)
    except (PyMongoError, RuntimeError) as exc:
        raise _db_error(exc)
    return doc


@app.get('/pipelines/item/{pipeline_id}')
async def get_pipeline(pipeline_id: str):
    """One saved pipeline by id."""
    try:
        col = pipelines_collection()
        doc = await col.find_one({'id': pipeline_id}, {'_id': 0})
    except (PyMongoError, RuntimeError) as exc:
        raise _db_error(exc)
    if not doc:
        raise HTTPException(status_code=404, detail='Pipeline not found')
    return doc


@app.delete('/pipelines/item/{pipeline_id}')
async def delete_pipeline(pipeline_id: str):
    """Delete a saved pipeline by id."""
    try:
        col = pipelines_collection()
        res = await col.delete_one({'id': pipeline_id})
    except (PyMongoError, RuntimeError) as exc:
        raise _db_error(exc)
    return {'deleted': res.deleted_count}
