"""Tests for the OpenAI recommendation service."""

import json
from unittest.mock import patch, MagicMock

import pytest

from app.schemas.events import EventRequest
from app.services.openai_recommendation import OpenAIRecommendationService


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


def _mock_response(events_json: str) -> MagicMock:
    """Build a mock OpenAI Responses API response."""
    text_block = MagicMock()
    text_block.type = "output_text"
    text_block.text = events_json

    message_item = MagicMock()
    message_item.type = "message"
    message_item.content = [text_block]

    response = MagicMock()
    response.output = [message_item]
    return response


@pytest.fixture
def mock_openai_client():
    with patch(
        "app.services.openai_recommendation.OpenAI"
    ) as mock_cls, patch(
        "app.services.recommendation_service.Anthropic"
    ) as mock_val_cls, patch(
        "app.services.recommendation_service.PROMPT_PATH"
    ) as mock_path, patch(
        "app.services.recommendation_service.VALIDATION_PROMPT_PATH"
    ) as mock_val_path:
        mock_path.read_text.return_value = "system prompt"
        mock_val_path.read_text.return_value = "validation prompt"
        mock_client = MagicMock()
        mock_cls.return_value = mock_client
        mock_val_client = MagicMock()
        mock_val_cls.return_value = mock_val_client
        mock_val_text = MagicMock()
        mock_val_text.text = json.dumps([SAMPLE_EVENT])
        mock_val_response = MagicMock()
        mock_val_response.content = [mock_val_text]
        mock_val_client.messages.create.return_value = mock_val_response
        yield mock_client


class TestOpenAIRecommendationService:
    """Tests for OpenAIRecommendationService."""

    def test_returns_parsed_events(self, mock_openai_client):
        mock_openai_client.responses.create.return_value = _mock_response(
            json.dumps([SAMPLE_EVENT])
        )
        service = OpenAIRecommendationService()
        events = service.get_recommendations(EventRequest(city="NYC", interests="jazz"))
        assert len(events) == 1
        assert events[0].name == "Jazz Night"

    def test_calls_openai_with_correct_model(self, mock_openai_client):
        mock_openai_client.responses.create.return_value = _mock_response(
            json.dumps([SAMPLE_EVENT])
        )
        service = OpenAIRecommendationService()
        service.get_recommendations(EventRequest(city="NYC", interests="jazz"))
        call_kwargs = mock_openai_client.responses.create.call_args
        assert call_kwargs.kwargs["model"] == "gpt-5.4-mini"

    def test_enables_web_search(self, mock_openai_client):
        mock_openai_client.responses.create.return_value = _mock_response(
            json.dumps([SAMPLE_EVENT])
        )
        service = OpenAIRecommendationService()
        service.get_recommendations(EventRequest(city="NYC", interests="jazz"))
        call_kwargs = mock_openai_client.responses.create.call_args
        tools = call_kwargs.kwargs["tools"]
        assert any(t["type"] == "web_search_preview" for t in tools)

    def test_api_error_propagates(self, mock_openai_client):
        mock_openai_client.responses.create.side_effect = Exception("API down")
        service = OpenAIRecommendationService()
        with pytest.raises(Exception, match="API down"):
            service.get_recommendations(EventRequest(city="NYC", interests="jazz"))
