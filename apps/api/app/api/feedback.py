from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_admin_user, get_current_user
from app.models.feedback import UserFeedback
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackListResponse,
    FeedbackResponse,
    FeedbackStatusUpdate,
)

router = APIRouter()


def _to_feedback_response(item: UserFeedback) -> FeedbackResponse:
    return FeedbackResponse(
        id=item.id,
        user_id=item.user_id,
        user_email=item.user.email if item.user else "",
        message=item.message,
        status=item.status,
        created_at=item.created_at,
    )


@router.post("/", response_model=FeedbackResponse)
def create_feedback(
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    feedback = UserFeedback(user_id=current_user.id, message=payload.message.strip())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return _to_feedback_response(feedback)


@router.get("/mine", response_model=FeedbackListResponse)
def get_my_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    items = (
        db.query(UserFeedback)
        .filter(UserFeedback.user_id == current_user.id)
        .order_by(UserFeedback.created_at.desc())
        .all()
    )
    return FeedbackListResponse(items=[_to_feedback_response(item) for item in items], total=len(items))


@router.get("/admin", response_model=FeedbackListResponse)
def get_all_feedback(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
) -> Any:
    items = db.query(UserFeedback).order_by(UserFeedback.created_at.desc()).all()
    return FeedbackListResponse(items=[_to_feedback_response(item) for item in items], total=len(items))


@router.patch("/admin/{feedback_id}", response_model=FeedbackResponse)
def update_feedback_status(
    feedback_id: int,
    payload: FeedbackStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
) -> Any:
    feedback = db.query(UserFeedback).filter(UserFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found.")

    feedback.status = payload.status
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return _to_feedback_response(feedback)
