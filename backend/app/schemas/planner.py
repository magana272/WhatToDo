"""Schemas for planner endpoint."""
from pydantic import BaseModel, Field
from .events import  EventResponse

class PlannerRequest(BaseModel):
    """Request schema for planner endpoint."""
    location: str
    date: str
    timeRange: str
    budget: float | None = Field(None, ge=0, le=10000)
    preference: str | None = None
    interests: list[str]


class PlannerResponse(BaseModel):
    """Response schema for planner endpoint."""
    title: str
    date: str
    city: str
    summary: str
    activities: list[EventResponse]
