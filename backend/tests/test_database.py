# pyrefly: ignore [missing-import]
import pytest
from app.database import get_sync_collection

def test_sync_collection_write_read():
    col = get_sync_collection("test_sync")
    col.delete_many({})
    col.insert_one({"name": "test_doc", "value": 42})
    doc = col.find_one({"name": "test_doc"})
    assert doc is not None
    assert doc["value"] == 42
