"""Router for planner endpoint,
providing event recommendations based on user preferences.
"""
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.middleware.auth import get_current_user
from app.models.planner import Planner
from app.models.saved_event import SavedEvent
from app.models.user import User
from app.schemas.planner import PlannerRequest, PlannerResponse
from app.services.planner_service import PlannerRecommendationService

router = APIRouter()


@router.post("/planner", response_model=PlannerResponse)
def recommend_events(
    request: PlannerRequest,
    provider: Literal["openai", "claude"] = Query(
        "openai", description="Choose the recommendation provider"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate event recommendations and save as a planner with activities."""
    service = PlannerRecommendationService(provider)
    try:
        raw = service.get_recommendations(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    result = raw if isinstance(raw, PlannerResponse) else PlannerResponse(**raw)

    planner = Planner(
        user_id=current_user.id,
        title=result.title,
        date=result.date,
        city=result.city,
        summary=result.summary, 
    )
    db.add(planner)
    db.flush()

    for activity in result.activities:
        event = SavedEvent(
            user_id=current_user.id,
            planner_id=planner.id,
            title=activity.activity,
            date=result.date,
            time=activity.time,
            location=activity.location,
            tag=activity.activityType,
            price=str(activity.price),
        )
        db.add(event)

    db.commit()
    db.refresh(planner)

    return result
