"""Tests for the interests vocabulary router and loader."""

from fastapi.testclient import TestClient

from app.main import app
from app.interests.interset import load_interests

client = TestClient(app)


def test_get_interests_returns_vocabulary():
    response = client.get("/interests")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert all(isinstance(item, str) for item in data)


def test_get_interests_excludes_header_and_is_sorted():
    data = client.get("/interests").json()
    assert "Hobby" not in data
    assert data == sorted(data, key=str.lower)


def test_load_interests_is_deduplicated():
    data = load_interests()
    lowered = [item.lower() for item in data]
    assert len(lowered) == len(set(lowered))
