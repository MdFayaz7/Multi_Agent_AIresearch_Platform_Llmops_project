# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import patch
# pyrefly: ignore [missing-import]
from bson import ObjectId

@pytest.fixture
def auth_header(client):
    # Register and login to get auth header
    client.post("/api/auth/register", json={
        "email": "researcher@example.com",
        "username": "researcher",
        "password": "password123"
    })
    response = client.post("/api/auth/login", data={
        "username": "researcher@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_create_and_get_research(client, auth_header):
    # Mock pipeline trigger
    with patch("app.api.research.run_research_pipeline") as mock_pipeline:
        payload = {"topic": "Quantum Computing"}
        response = client.post("/api/research", json=payload, headers=auth_header)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["status"] == "queued"
        mock_pipeline.assert_called_once()

        # Get research details
        research_id = data["id"]
        response = client.get(f"/api/research/{research_id}", headers=auth_header)
        assert response.status_code == 200
        assert response.json()["topic"] == "Quantum Computing"
