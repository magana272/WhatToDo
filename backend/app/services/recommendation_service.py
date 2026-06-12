import json
from pathlib import Path
from datetime import date, datetime, time
from abc import ABC, abstractmethod

from anthropic import Anthropic

from app.core.config import settings, BACKEND_DIR
from app.schemas.events import EventRequest, Event

PROMPT_PATH = BACKEND_DIR / "prompts" / "prompt.txt"
VALIDATION_PROMPT_PATH = BACKEND_DIR / "prompts" / "validation_prompt.txt"


class EventRecommendationService(ABC):

    def __init__(self):
        self._system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
        self._validation_prompt = VALIDATION_PROMPT_PATH.read_text(encoding="utf-8")
        print("EventRecommendationService initialized")

    def _build_user_message(self, request: EventRequest) -> str:
        parts = [
            f"Find real upcoming events in {request.city} related to: {request.interests}.",
            f"Today's date is {date.today().isoformat()}.",
        ]
        if request.budget is not None:
            parts.append(f"My budget is ${request.budget} per person.")
        if request.date_range:
            parts.append(f"Preferred dates: {request.date_range}.")
        message = " ".join(parts)
        print("Built user message preview=", message[:500])
        return message

    def _parse_events(self, content: str) -> list[Event]:
        print("Starting _parse_events")
        print("Raw content preview=", content[:1000] if content else "")

        content = content.strip()
        if "```" in content:
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()

        start = content.find("[")
        end = content.rfind("]")
        if start != -1 and end != -1:
            content = content[start:end + 1]

        print("Normalized content preview=", content[:1000] if content else "")

        events_data = json.loads(content)
        events = [Event(**event) for event in events_data]
        print("Parsed events count=", len(events))
        return events

    def _sort(self, events: list[Event]) -> list[Event]:
        print("Sorting events count=", len(events))
        return sorted(events, key=lambda e: e.start_time)

    def _validate_events(self, events: list[Event], request: EventRequest) -> list[Event]:
        print("Starting _validate_events with events count=", len(events))
        if not events:
            print("No events to validate")
            return events

        events_json = json.dumps([e.model_dump() for e in events])
        user_context = f"User requested: city={request.city}, date_range={request.date_range}, today={date.today().isoformat()}"

        client = Anthropic(api_key=settings.claude_api_key)
        print("Calling Anthropic validation model")

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=16000,
            system=self._validation_prompt,
            messages=[
                {"role": "user", "content": f"{user_context}\n\nEvents:\n{events_json}"},
            ],
            temperature=0,
        )

        print("Anthropic validation model returned")
        text = response.content[0].text
        print("Validation response preview=", text[:1000] if text else "")
        return self._parse_events(text)

    @staticmethod
    def _parse_time(time_str: str) -> time | None:
        for fmt in ("%H:%M", "%I%p", "%I:%M%p", "%I %p", "%I:%M %p"):
            try:
                return datetime.strptime(time_str.strip().upper(), fmt).time()
            except ValueError:
                continue
        return None

    def _filter_by_time(self, events: list[Event], request: EventRequest) -> list[Event]:
        print(
            "Filtering events by time. count=",
            len(events),
            "start=",
            request.day_start_time,
            "end=",
            request.day_end_time,
        )

        if not request.day_start_time and not request.day_end_time:
            print("No time filters provided")
            return events

        start_bound = self._parse_time(request.day_start_time) if request.day_start_time else None
        end_bound = self._parse_time(request.day_end_time) if request.day_end_time else None

        if start_bound is None and end_bound is None:
            print("Could not parse any time bounds")
            return events

        filtered = []
        for event in events:
            try:
                ev_start = datetime.fromisoformat(event.start_time)
                ev_end = datetime.fromisoformat(event.end_time)
            except (ValueError, TypeError):
                print(
                    "Could not parse event times for event=",
                    getattr(event, "name", None),
                    "start=",
                    getattr(event, "start_time", None),
                    "end=",
                    getattr(event, "end_time", None),
                )
                filtered.append(event)
                continue

            ev_start_time = ev_start.time()
            ev_end_time = ev_end.time()

            if end_bound and ev_start_time > end_bound:
                continue
            if start_bound and ev_end_time < start_bound:
                continue

            if start_bound and ev_start_time < start_bound:
                ev_start = ev_start.replace(hour=start_bound.hour, minute=start_bound.minute, second=0)
                event.start_time = ev_start.isoformat()
                event.start_time_as_ampm = ev_start.strftime("%I:%M %p").lstrip("0")

            if end_bound and ev_end_time > end_bound:
                ev_end = ev_end.replace(hour=end_bound.hour, minute=end_bound.minute, second=0)
                event.end_time = ev_end.isoformat()
                event.end_time_as_ampm = ev_end.strftime("%I:%M %p").lstrip("0")

            event.duration_minutes = int((ev_end - ev_start).total_seconds() / 60)
            filtered.append(event)

        print("Filtered events count=", len(filtered))
        return filtered

    @abstractmethod
    def get_recommendations(self, request: EventRequest) -> list[Event]:
        pass


EVENTS_TOOL = {
    "name": "submit_events",
    "description": (
        "Submit the final list of verified events. Call this tool exactly once "
        "with all events you found via web search. Each event must have all 15 "
        "required fields with correct types."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "events": {
                "type": "array",
                "items": Event.model_json_schema(),
            }
        },
        "required": ["events"],
    },
}