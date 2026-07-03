"""
Two Mongo clients on purpose:

- `db` (motor, async)  -> used by FastAPI request handlers.
- `get_sync_collection` (pymongo, sync) -> used by the background thread that
  runs the LangGraph/LangChain pipeline, because that pipeline code is
  synchronous and runs inside FastAPI's threadpool (not the asyncio loop),
  where an async motor client cannot be safely reused.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.config import settings

# --- async client (FastAPI routes) ---
motor_client = AsyncIOMotorClient(settings.MONGO_URI)
db = motor_client[settings.MONGO_DB_NAME]

users_collection = db["users"]
research_collection = db["research"]

# --- sync client (background pipeline thread) ---
_sync_client = MongoClient(settings.MONGO_URI)
_sync_db = _sync_client[settings.MONGO_DB_NAME]


def get_sync_collection(name: str):
    return _sync_db[name]


async def init_indexes():
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("username", unique=True)
    await research_collection.create_index([("user_id", 1), ("created_at", -1)])
    await research_collection.create_index([("topic", "text")])
