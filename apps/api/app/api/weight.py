from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.user_weight import UserWeight
from app.services.tdee_engine import compute_ewma_trend

router = APIRouter()


class WeightLogRequest(BaseModel):
    weight_kg: float
    date_logged: Optional[date] = None


class WeightEntryResponse(BaseModel):
    id: int
    date_logged: date
    weight_kg: float
    trend_weight: float

    class Config:
        from_attributes = True


class WeightHistoryResponse(BaseModel):
    entries: List[WeightEntryResponse]
    current_trend_kg: Optional[float]
    total_change_kg: Optional[float]  # First trend vs latest trend over window


@router.post("/", response_model=WeightEntryResponse)
def log_weight(
    payload: WeightLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Log a daily morning weight.
    Automatically computes and stores the EWMA trend weight.
    """
    log_date = payload.date_logged or date.today()

    # Check for existing entry on this date — update if exists
    existing = (
        db.query(UserWeight)
        .filter(UserWeight.user_id == current_user.id, UserWeight.date_logged == log_date)
        .first()
    )

    # Fetch previous trend for EWMA computation
    previous = (
        db.query(UserWeight)
        .filter(UserWeight.user_id == current_user.id, UserWeight.date_logged < log_date)
        .order_by(UserWeight.date_logged.desc())
        .first()
    )

    trend = compute_ewma_trend(
        payload.weight_kg,
        previous.trend_weight if previous else None
    )

    if existing:
        existing.weight_kg = payload.weight_kg
        existing.trend_weight = trend
        db.commit()
        db.refresh(existing)
        return existing

    new_entry = UserWeight(
        user_id=current_user.id,
        date_logged=log_date,
        weight_kg=payload.weight_kg,
        trend_weight=trend,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/history", response_model=WeightHistoryResponse)
def get_weight_history(
    days: int = 28,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns weight entries for the last N days.
    Also returns current EWMA trend and total change over the window.
    """
    cutoff = date.today() - timedelta(days=days)

    entries = (
        db.query(UserWeight)
        .filter(UserWeight.user_id == current_user.id, UserWeight.date_logged >= cutoff)
        .order_by(UserWeight.date_logged.asc())
        .all()
    )

    current_trend = entries[-1].trend_weight if entries else None
    first_trend = entries[0].trend_weight if entries else None
    total_change = round(current_trend - first_trend, 2) if (current_trend and first_trend) else None

    return WeightHistoryResponse(
        entries=entries,
        current_trend_kg=round(current_trend, 2) if current_trend else None,
        total_change_kg=total_change,
    )
