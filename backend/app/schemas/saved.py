from pydantic import BaseModel
from datetime import datetime

class SavedEventCreate(BaseModel):
    title: str
    date: str
    time: str
    location: str
    tag: str
    price: str

class SavedEventResponse(BaseModel):
    id: int
    user_id: int
    title: str
    date: str
    time: str
    location: str
    tag: str
    price: str
    saved_at: datetime

    class Config:
        from_attributes = True