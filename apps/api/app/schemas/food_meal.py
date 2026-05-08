from pydantic import BaseModel
from typing import List, Optional
from datetime import date

# --- FOOD SCHEMAS ---
class FoodBase(BaseModel):
    name: str
    base_calories: float
    protein_g: float
    carbs_g: float
    fats_g: float
    fiber_g: float

class FoodResponse(FoodBase):
    id: int

    class Config:
        from_attributes = True

# --- MEAL SCHEMAS ---
class MealEntryCreate(BaseModel):
    food_id: int
    quantity: float
    unit_type: str # 'katori', 'roti', 'grams', 'pieces'
    meal_type: str = "general"


class MealEntryUpdate(BaseModel):
    quantity: float
    unit_type: str
    meal_type: Optional[str] = None

class MealEntryResponse(BaseModel):
    id: int
    food: FoodResponse
    date_logged: date
    meal_type: str
    quantity: float
    unit_type: str
    calculated_calories: float
    calculated_protein: float

    class Config:
        from_attributes = True

class DailySummaryResponse(BaseModel):
    date_logged: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fats: float

    class Config:
        from_attributes = True


class MealLogListResponse(BaseModel):
    entries: List[MealEntryResponse]
