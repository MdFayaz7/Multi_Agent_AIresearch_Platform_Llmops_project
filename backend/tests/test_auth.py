# pyrefly: ignore [missing-import]
import pytest

def test_signup_and_login(client):
    # Test Signup
    signup_payload = {
        "email": "fayazm5cs@gmail.com",
        "username": "MdFayaz",
        "password": "Fayaz@123"
    }
    response = client.post("/api/auth/register", json=signup_payload)
    assert response.status_code == 201
    assert "access_token" in response.json()

    # Test Login
    login_payload = {
        "username": "fayazm5cs@gmail.com",
        "password": "Fayaz@123"
    }
    response = client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Test Auth Me
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "fayazm5cs@gmail.com"
