from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.food import Food
from app.schemas.food_meal import FoodResponse

router = APIRouter()

@router.get("/search", response_model=List[FoodResponse])
def search_foods(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """
    Search global food catalog.
    """
    foods = db.query(Food).filter(Food.name.ilike(f"%{q}%")).limit(10).all()
    return foods

@router.get("/", response_model=List[FoodResponse])
def get_recent_foods(db: Session = Depends(get_db)):
    """
    Get top recently used or common foods.
    """
    return db.query(Food).limit(20).all()
