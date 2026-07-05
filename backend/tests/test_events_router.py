"""Tests for the events recommendation router."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.schemas.events import Event
from app.main import app
from app.routers import events as events_module

SAMPLE_EVENT = {
    "name": "Jazz Night",
    "description": "Live jazz.",
    "location": "Blue Note, NYC",
    "category": "entertainment",
    "estimated_cost": 25.0,
    "duration_minutes": 120,
    "indoor": True,
    "tags": ["jazz"],
    "source": "Eventbrite",
    "event_url": "https://eventbrite.com/e/123",
    "start_time": "2026-04-15T20:00:00",
    "start_time_as_ampm": "8:00 PM",
    "end_time": "2026-04-15T22:00:00",
    "end_time_as_ampm": "10:00 PM",
    "verified": True,
}

VALID_REQUEST = {"city": "NYC", "interests": "jazz"}


@pytest.fixture
def client():

    mock_openai = MagicMock()
    mock_claude = MagicMock()
    mock_openai.get_recommendations.return_value = [Event(**SAMPLE_EVENT)]
    mock_claude.get_recommendations.return_value = [Event(**SAMPLE_EVENT)]

    original_openai = events_module.openai_service
    original_claude = events_module.claude_service
    events_module.openai_service = mock_openai
    events_module.claude_service = mock_claude
    try:
        yield TestClient(app), mock_openai, mock_claude
    finally:
        events_module.openai_service = original_openai
        events_module.claude_service = original_claude


class TestEventsEndpoint:
    """Tests for POST /events/recommendations."""

    def test_returns_200_with_valid_request(self, client):
        tc, _, _ = client
        response = tc.post("/events/recommendations", json=VALID_REQUEST)
        assert response.status_code == 200

    def test_response_contains_event_fields(self, client):
        tc, _, _ = client
        response = tc.post("/events/recommendations", json=VALID_REQUEST)
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Jazz Night"
        assert data[0]["estimated_cost"] == 25.0

    def test_defaults_to_openai_provider(self, client):
        tc, mock_openai, mock_claude = client
        tc.post("/events/recommendations", json=VALID_REQUEST)
        mock_openai.get_recommendations.assert_called_once()
        mock_claude.get_recommendations.assert_not_called()

    def test_claude_provider(self, client):
        tc, mock_openai, mock_claude = client
        tc.post("/events/recommendations?provider=claude", json=VALID_REQUEST)
        mock_claude.get_recommendations.assert_called_once()
        mock_openai.get_recommendations.assert_not_called()

    def test_invalid_provider_returns_422(self, client):
        tc, _, _ = client
        response = tc.post(
            "/events/recommendations?provider=invalid", json=VALID_REQUEST
        )
        assert response.status_code == 422

    def test_empty_body_returns_422(self, client):
        tc, _, _ = client
        response = tc.post("/events/recommendations", json={})
        assert response.status_code == 422

    def test_service_error_returns_500(self, client):
        tc, mock_openai, _ = client
        mock_openai.get_recommendations.side_effect = Exception("API failure")
        response = tc.post("/events/recommendations", json=VALID_REQUEST)
        assert response.status_code == 500
        assert "API failure" in response.json()["detail"]

    def test_optional_fields_passed_through(self, client):
        tc, mock_openai, _ = client
        full_request = {
            "city": "Boston",
            "interests": "food",
            "budget": 50.0,
            "date_range": "2026-03-15 to 2026-03-20",
        }
        tc.post("/events/recommendations", json=full_request)
        call_args = mock_openai.get_recommendations.call_args
        req = call_args[0][0]
        assert req.city == "Boston"
        assert req.budget == 50.0
