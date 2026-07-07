import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
import mongomock
from bson import ObjectId

# Force dummy environment vars for testing
import os
os.environ["MONGO_URI"] = "mongodb://localhost:27017"
os.environ["MONGO_DB_NAME"] = "test_db"
os.environ["JWT_SECRET"] = "test_secret_key_that_is_long_enough"
os.environ["OPENROUTER_API_KEY"] = "dummy-openrouter-key"
os.environ["TAVILY_API_KEY"] = "dummy-tavily-key"
os.environ["LANGCHAIN_API_KEY"] = "dummy-langchain-key"
os.environ["LANGCHAIN_TRACING_V2"] = "false"

import app.database
# Patch MongoDB clients with mongomock
mock_sync_client = mongomock.MongoClient()
mock_sync_db = mock_sync_client["test_db"]

# Override database modules
app.database._sync_client = mock_sync_client
app.database._sync_db = mock_sync_db

# Patch async motor db with a sync mock proxy for simplicity in tests
class AsyncMockCollection:
    def __init__(self, sync_col):
        self.sync_col = sync_col

    async def insert_one(self, doc):
        # mongomock mutates the doc by inserting _id
        res = self.sync_col.insert_one(doc)
        class Res:
            inserted_id = res.inserted_id
        return Res()

    async def find_one(self, query):
        return self.sync_col.find_one(query)

    async def delete_one(self, query):
        res = self.sync_col.delete_one(query)
        class Res:
            deleted_count = res.deleted_count
        return Res()

    async def update_one(self, query, update_op):
        res = self.sync_col.update_one(query, update_op)
        class Res:
            modified_count = res.modified_count
        return Res()

    async def count_documents(self, query):
        return self.sync_col.count_documents(query)

    def find(self, query):
        cursor = self.sync_col.find(query)
        class AsyncCursor:
            def __init__(self, c):
                self.c = c
            def sort(self, key, direction=1):
                self.c = self.c.sort(key, direction)
                return self
            def skip(self, n):
                self.c = self.c.skip(n)
                return self
            def limit(self, n):
                self.c = self.c.limit(n)
                return self
            def __aiter__(self):
                self.items = list(self.c)
                self.idx = 0
                return self
            async def __anext__(self):
                if self.idx >= len(self.items):
                    raise StopAsyncIteration
                val = self.items[self.idx]
                self.idx += 1
                return val
        return AsyncCursor(cursor)

    async def create_index(self, *args, **kwargs):
        pass

app.database.users_collection = AsyncMockCollection(mock_sync_db["users"])
app.database.research_collection = AsyncMockCollection(mock_sync_db["research"])

from app.main import app as fastapi_app

@pytest.fixture
def client():
    with TestClient(fastapi_app) as c:
        yield c

@pytest.fixture(autouse=True)
def clean_db():
    mock_sync_db["users"].delete_many({})
    mock_sync_db["research"].delete_many({})
