from pydantic import BaseModel, Field

class EventRequest(BaseModel):
    city: str = Field(..., description="City to search events in")
    interests: str = Field(..., description="User interests or event type")
    budget: float | None = Field(None, description="Max budget in USD per person")
    date_range: str | None = Field(None, description="Preferred date range, e.g. '2026-03-15 to 2026-03-20'")
    day_start_time: str | None = Field(None, description="Preferred start time of day: '09:00', '9AM', '9:30pm'") # 9m, 12pm?
    day_end_time: str | None = Field(None, description="Preferred end time of day: '21:00', '9PM', '9:30pm'") # 9pm, 2am?

class EventResponse(BaseModel):
    id: str
    time: str
    location: str
    activity: str
    activityType: str
    price: float
    info: str
    website: str
class Event(BaseModel):
    name: str
    description: str
    location: str
    category: str
    estimated_cost: float
    duration_minutes: int
    indoor: bool
    tags: list[str]
    source: str
    event_url: str
    start_time: str
    start_time_as_ampm: str
    end_time: str
    end_time_as_ampm: str
    verified: bool
