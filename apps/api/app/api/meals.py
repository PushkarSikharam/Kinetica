import json
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.food import Food
from app.models.meal import DailySummary, MealEntry
from app.models.user import User
from app.schemas.food_meal import (
    DailySummaryResponse,
    MealEntryCreate,
    MealEntryResponse,
    MealEntryUpdate,
    MealLogListResponse,
)
from app.schemas.nlp import NLPLogRequest, NLPLogResponse
from app.services.ai_service import ai_service

router = APIRouter()


def _get_unit_scalar(user: User, quantity: float, unit_type: str) -> float:
    normalized_unit = unit_type.lower()
    if normalized_unit == "grams":
        return quantity / 100.0
    if normalized_unit == "katori":
        return quantity * user.katori_multiplier
    if normalized_unit == "roti":
        return quantity * user.roti_multiplier
    if normalized_unit in {"pieces", "piece"}:
        return quantity
    raise HTTPException(status_code=400, detail="Unsupported unit type.")


def _meal_totals(food: Food, scalar: float) -> dict[str, float]:
    return {
        "calories": scalar * food.base_calories,
        "protein": scalar * food.protein_g,
        "carbs": scalar * food.carbs_g,
        "fats": scalar * food.fats_g,
    }


def _rebuild_daily_summary(user: User, summary_date: date, db: Session) -> DailySummary:
    entries = (
        db.query(MealEntry)
        .filter(MealEntry.user_id == user.id, MealEntry.date_logged == summary_date)
        .all()
    )

    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0, "fats": 0.0}
    for entry in entries:
        food = entry.food
        scalar = _get_unit_scalar(user, entry.quantity, entry.unit_type)
        meal_total = _meal_totals(food, scalar)
        totals["calories"] += meal_total["calories"]
        totals["protein"] += meal_total["protein"]
        totals["carbs"] += meal_total["carbs"]
        totals["fats"] += meal_total["fats"]

    summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user.id, DailySummary.date_logged == summary_date)
        .first()
    )

    if not entries:
        if summary:
            db.delete(summary)
            db.flush()
        return DailySummary(
            user_id=user.id,
            date_logged=summary_date,
            total_calories=0,
            total_protein=0,
            total_carbs=0,
            total_fats=0,
        )

    if not summary:
        summary = DailySummary(user_id=user.id, date_logged=summary_date)
        db.add(summary)

    summary.total_calories = totals["calories"]
    summary.total_protein = totals["protein"]
    summary.total_carbs = totals["carbs"]
    summary.total_fats = totals["fats"]
    db.flush()
    return summary


@router.post("/", response_model=MealEntryResponse)
def log_meal_entry(
    entry_in: MealEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    food = db.query(Food).filter(Food.id == entry_in.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found.")

    scalar = _get_unit_scalar(current_user, entry_in.quantity, entry_in.unit_type)
    totals = _meal_totals(food, scalar)

    new_entry = MealEntry(
        user_id=current_user.id,
        food_id=food.id,
        date_logged=date.today(),
        meal_type=entry_in.meal_type,
        quantity=entry_in.quantity,
        unit_type=entry_in.unit_type.lower(),
        calculated_calories=totals["calories"],
        calculated_protein=totals["protein"],
    )
    db.add(new_entry)
    db.flush()

    _rebuild_daily_summary(current_user, date.today(), db)
    db.commit()
    db.refresh(new_entry)
    return new_entry


@router.get("/today", response_model=DailySummaryResponse)
def get_today_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    summary = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == current_user.id, DailySummary.date_logged == date.today())
        .first()
    )

    if not summary:
        return DailySummaryResponse(
            date_logged=date.today(),
            total_calories=0,
            total_protein=0,
            total_carbs=0,
            total_fats=0,
        )

    return summary


@router.get("/today/entries", response_model=MealLogListResponse)
def get_today_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    entries = (
        db.query(MealEntry)
        .filter(MealEntry.user_id == current_user.id, MealEntry.date_logged == date.today())
        .order_by(MealEntry.created_at.desc())
        .all()
    )
    return MealLogListResponse(entries=entries)


@router.get("/history", response_model=MealLogListResponse)
def get_meal_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    entries = (
        db.query(MealEntry)
        .filter(MealEntry.user_id == current_user.id)
        .order_by(MealEntry.date_logged.desc(), MealEntry.created_at.desc())
        .all()
    )
    return MealLogListResponse(entries=entries)


@router.put("/{meal_entry_id}", response_model=MealEntryResponse)
def update_meal_entry(
    meal_entry_id: int,
    payload: MealEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    entry = (
        db.query(MealEntry)
        .filter(MealEntry.id == meal_entry_id, MealEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Meal entry not found.")

    scalar = _get_unit_scalar(current_user, payload.quantity, payload.unit_type)
    totals = _meal_totals(entry.food, scalar)

    entry.quantity = payload.quantity
    entry.unit_type = payload.unit_type.lower()
    if payload.meal_type is not None:
        entry.meal_type = payload.meal_type
    entry.calculated_calories = totals["calories"]
    entry.calculated_protein = totals["protein"]

    db.add(entry)
    db.flush()
    _rebuild_daily_summary(current_user, entry.date_logged, db)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{meal_entry_id}")
def delete_meal_entry(
    meal_entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    entry = (
        db.query(MealEntry)
        .filter(MealEntry.id == meal_entry_id, MealEntry.user_id == current_user.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Meal entry not found.")

    entry_date = entry.date_logged
    db.delete(entry)
    db.flush()
    _rebuild_daily_summary(current_user, entry_date, db)
    db.commit()
    return {"success": True}


@router.post("/parse-text", response_model=NLPLogResponse)
async def parse_natural_language_meal(
    request: NLPLogRequest,
    _: User = Depends(get_current_user),
) -> Any:
    try:
        prompt = f"""
        Extract the food, quantity, and unit from this log. Your response MUST be raw JSON and absolutely nothing else.
        Valid units: 'katori', 'roti', 'grams', 'pieces'.

        Log: "{request.text}"

        Expected Format: {{"food_identified": "Dal Tadka", "quantity": 1.5, "unit": "katori"}}
        """
        text_response = ai_service.generate(prompt).replace("```json", "").replace("```", "").strip()
        data = json.loads(text_response)

        return NLPLogResponse(
            success=True,
            food_identified=data.get("food_identified", "Unknown"),
            quantity=float(data.get("quantity", 1.0)),
            unit=str(data.get("unit", "pieces")).lower(),
            confidence=0.95,
            message="Parsed successfully.",
        )
    except Exception as exc:
        return NLPLogResponse(
            success=False,
            food_identified="",
            quantity=0,
            unit="",
            confidence=0.0,
            message=str(exc),
        )
