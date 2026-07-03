# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import MagicMock, patch
# pyrefly: ignore [missing-import]
from bson import ObjectId
from app.services.pipeline_service import run_research_pipeline
from app.database import get_sync_collection

class DummyResponse:
    def __init__(self, content):
        self.content = content

def test_run_research_pipeline_success():
    # Insert test research document
    col = get_sync_collection("research")
    col.delete_many({})
    user_id = ObjectId()
    research_id = col.insert_one({
        "user_id": user_id,
        "topic": "Artificial Intelligence",
        "status": "queued"
    }).inserted_id

    # Create mock agents/chains responses
    mock_search_agent = MagicMock()
    mock_search_agent.invoke.return_value = {
        "messages": [DummyResponse("Search Results: AI is future")]
    }

    mock_reader_agent = MagicMock()
    mock_reader_agent.invoke.return_value = {
        "messages": [DummyResponse("Scraped content detailing AI future")]
    }

    mock_writer = MagicMock()
    mock_writer.invoke.return_value = "## AI Report\nDetailed explanation."

    mock_critic = MagicMock()
    mock_critic.invoke.return_value = "Score: 9/10\nVerdict: Great."

    with patch("app.services.pipeline_service.buid_search_agent", return_value=mock_search_agent), \
         patch("app.services.pipeline_service.build_reader_agent", return_value=mock_reader_agent), \
         patch("app.services.pipeline_service.writer_chain", mock_writer), \
         patch("app.services.pipeline_service.critic_chain", mock_critic):

        run_research_pipeline(str(research_id))

    # Assert database updates happened
    doc = col.find_one({"_id": research_id})
    assert doc["status"] == "completed"
    assert doc["search_results"] == "Search Results: AI is future"
    assert doc["scraped_content"] == "Scraped content detailing AI future"
    assert doc["report"] == "## AI Report\nDetailed explanation."
    assert doc["critic_feedback"] == "Score: 9/10\nVerdict: Great."
    assert "search" in doc["agent_timings"]
    assert "reading" in doc["agent_timings"]
    assert "writing" in doc["agent_timings"]
    assert "critic" in doc["agent_timings"]
