# db.py
# --------------------------------------------------
# MongoDB connection for app persistence (saved pipelines). The connection
# string is read from backend/.env (MONGO_URI) and never hard-coded.

import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load backend/.env regardless of the process's working directory.
load_dotenv(Path(__file__).resolve().parent / ".env")

MONGO_URI = os.getenv("MONGO_URI", "").strip()
DB_NAME = os.getenv("MONGO_DB", "vectorshift").strip() or "vectorshift"

_client: AsyncIOMotorClient | None = None


def pipelines_collection():
    """Return the saved-pipelines collection, creating the client lazily."""
    global _client
    if not MONGO_URI:
        raise RuntimeError(
            "MONGO_URI is not set. Add it to backend/.env, e.g.\n"
            "  MONGO_URI=mongodb+srv://user:pass@cluster.../"
        )
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=6000)
    return _client[DB_NAME]["pipelines"]
