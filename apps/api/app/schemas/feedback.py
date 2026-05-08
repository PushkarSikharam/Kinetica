from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FeedbackCreate(BaseModel):
    message: str


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    message: str
    status: str
    created_at: datetime


class FeedbackStatusUpdate(BaseModel):
    status: str


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int
