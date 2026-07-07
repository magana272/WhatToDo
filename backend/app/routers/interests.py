from fastapi import APIRouter

from app.interests.interset import load_interests

router = APIRouter()


@router.get("/interests", response_model=list[str])
def get_interests():
    """Return the interest vocabulary used for autocomplete."""
    return load_interests()
