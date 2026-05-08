from datetime import datetime
from typing import Literal, Optional

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
    status: Literal["unread", "read", "resolved"]


class FeedbackListResponse(BaseModel):
    items: list[FeedbackResponse]
    total: int
