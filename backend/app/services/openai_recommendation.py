from openai import OpenAI

from app.core.config import settings
from app.schemas.events import EventRequest, Event
from .recommendation_service import EventRecommendationService


class OpenAIRecommendationService(EventRecommendationService):

    def __init__(self):
        super().__init__()
        self._client = OpenAI(api_key=settings.openai_api_key)
        print("OpenAIRecommendationService initialized", flush=True)

    def get_recommendations(self, request: EventRequest) -> list[Event]:
        print(
            "OpenAI get_recommendations called",
            {
                "city": request.city,
                "interests": request.interests,
                "budget": request.budget,
                "date_range": request.date_range,
                "day_start_time": request.day_start_time,
                "day_end_time": request.day_end_time,
            },
            flush=True,
        )

        user_message = self._build_user_message(request)
        print("Built user message", flush=True)

        print("Calling OpenAI responses.create", flush=True)
        try:
            response = self._client.responses.create(
                model="gpt-4o",
                tools=[{"type": "web_search_preview"}],
                instructions=self._system_prompt,
                input=user_message,
                temperature=0.2,
            )
            print("OpenAI responses.create returned", flush=True)
        except Exception as e:
            import traceback
            print("OpenAI responses.create failed:", repr(e), flush=True)
            traceback.print_exc()
            raise

        text = ""
        try:
            for item in response.output:
                if item.type == "message":
                    for block in item.content:
                        if block.type == "output_text":
                            text = block.text
            print("OpenAI output text preview=", text[:1000] if text else "", flush=True)
        except Exception as e:
            import traceback
            print("OpenAI response parsing failed:", repr(e), flush=True)
            traceback.print_exc()
            raise

        try:
            events = self._parse_events(text)
            print("OpenAI parsed events count=", len(events), flush=True)
        except Exception as e:
            import traceback
            print("OpenAI _parse_events failed:", repr(e), flush=True)
            traceback.print_exc()
            raise

        try:
            events = self._filter_by_time(events, request)
            print("OpenAI filtered events count=", len(events), flush=True)
        except Exception as e:
            import traceback
            print("OpenAI _filter_by_time failed:", repr(e), flush=True)
            traceback.print_exc()
            raise

        result = self._sort(events)
        print("OpenAI final sorted events count=", len(result), flush=True)
        return result