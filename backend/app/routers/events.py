from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.schemas.events import EventRequest, Event
from app.services.openai_recommendation import OpenAIRecommendationService
from app.services.claude_recommendation import ClaudeRecommendationService

router = APIRouter()

openai_service = OpenAIRecommendationService()
claude_service = ClaudeRecommendationService()


@router.post("/events/recommendations", response_model=list[Event])
def recommend_events(
    request: EventRequest,
    provider: Literal["openai", "claude"] = Query("openai", description="Choose the recommendation provider"),
):
    """Generate event recommendations using OpenAI or Claude."""
    service = openai_service if provider == "openai" else claude_service
    try:
        return service.get_recommendations(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
