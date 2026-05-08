from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.food import Food

class MealEntry(Base):
    __tablename__ = "meal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    
    date_logged = Column(Date, nullable=False, index=True)
    meal_type = Column(String, nullable=False) # e.g. "breakfast", "lunch", "dinner", "snack"

    # User input quantity
    quantity = Column(Float, nullable=False)
    # The volumetric unit they selected: "katori", "roti", "grams", "pieces"
    unit_type = Column(String, nullable=False)
    
    # Calculated deterministic values at the time of logging
    calculated_calories = Column(Float, nullable=False)
    calculated_protein = Column(Float, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    food = relationship("Food")

class DailySummary(Base):
    """Aggregate daily table for the 14-day trailing average algorithm."""
    __tablename__ = "daily_summaries"
    __table_args__ = (
        UniqueConstraint("user_id", "date_logged", name="uq_daily_summaries_user_id_date_logged"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_logged = Column(Date, nullable=False, index=True)

    total_calories = Column(Float, default=0.0)
    total_protein = Column(Float, default=0.0)
    total_carbs = Column(Float, default=0.0)
    total_fats = Column(Float, default=0.0)
    
    daily_weight_kg = Column(Float, nullable=True) # Used for trailing weight delta math
