"""Service to generate a day plan based on user preferences."""

from datetime import datetime

from app.schemas.events import Event, EventRequest, EventResponse
from app.schemas.planner import PlannerRequest, PlannerResponse
from app.services.openai_recommendation import OpenAIRecommendationService
from app.services.claude_recommendation import ClaudeRecommendationService

openai_service = OpenAIRecommendationService()
claude_service = ClaudeRecommendationService()


class PlannerRecommendationService:
    """Service to generate a day plan based on user preferences."""
    def __init__(self, provider: str = "openai"):
        if provider == "openai":
            self._client = openai_service
        else:
            self._client = claude_service

    def _parse_time_range(self, time_range: str) -> tuple[str | None, str | None]:
        if not time_range or " - " not in time_range:
            return None, None
        start, end = time_range.split(" - ", 1)
        return start.strip(), end.strip()

    def _build_event_request(self, request: PlannerRequest) -> EventRequest:
        start_time, end_time = self._parse_time_range(request.timeRange)

        interests = list(request.interests)
        if getattr(request, "preference", None):
            interests.append(request.preference)

        return EventRequest(
            city=request.location,
            interests=", ".join(interests),
            budget=request.budget,
            date_range=request.date,
            day_start_time=start_time,
            day_end_time=end_time,
        )

    def _to_event_response(self, event: Event, index: int) -> EventResponse:
        return EventResponse(
            id=str(index),
            time=event.start_time_as_ampm,
            location=event.location,
            activity=event.name,
            activityType=event.category.title(),
            price=event.estimated_cost,
            info=event.description,
            website=event.event_url,
        )

    def get_recommendations(self, request: PlannerRequest) -> PlannerResponse:
        """Get a day plan based on user preferences."""
        event_request = self._build_event_request(request)
        events = self._client.get_recommendations(event_request)

        activities = [
            self._to_event_response(event, index)
            for index, event in enumerate(events, start=1)
        ]

        day_name = datetime.fromisoformat(request.date).strftime("%A")

        return PlannerResponse(
            title=f"{day_name} Plan in {request.location}",
            date=request.date,
            city=request.location,
            summary=(
                f"A day plan based on {request.preference or 'general'} preferences, "
                f"budget {request.budget if request.budget is not None else 'flexible'}, "
                f"and {', '.join(request.interests)} interests."
            ),
            activities=activities,
        )
