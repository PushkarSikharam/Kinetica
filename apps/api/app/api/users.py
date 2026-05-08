from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import GoalType, Sex, User
from app.schemas.user import UserProfileResponse, UserProfileUpdate

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> Any:
    return current_user


@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if payload.biological_sex is not None:
        try:
            current_user.biological_sex = Sex(payload.biological_sex)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid biological sex.") from exc

    if payload.goal_type is not None:
        try:
            current_user.goal_type = GoalType(payload.goal_type)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid goal type.") from exc

    for field in [
        "display_name",
        "goal_rate_kg_week",
        "target_calories",
        "calorie_floor",
        "katori_multiplier",
        "roti_multiplier",
        "oil_level",
    ]:
        value = getattr(payload, field)
        if value is not None:
            setattr(current_user, field, value)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
