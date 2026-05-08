from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Food(Base):
    """Global immutable catalog of foods normalized to 100g."""
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    
    # All macros normalized per 100 grams
    base_calories = Column(Float, nullable=False) # per 100g
    protein_g = Column(Float, nullable=False) # per 100g
    carbs_g = Column(Float, nullable=False) # per 100g
    fats_g = Column(Float, nullable=False) # per 100g
    fiber_g = Column(Float, default=0.0) # per 100g
