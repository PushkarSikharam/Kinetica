from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class GoalType(str, enum.Enum):
    LOSE = "lose"
    MAINTAIN = "maintain"
    GAIN = "gain"

class Sex(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    
    # Volumetric Indian-first multipliers (scalars against 100g base)
    katori_multiplier = Column(Float, default=0.75)  # Default 75g medium katori
    roti_multiplier = Column(Float, default=0.35)    # Default 35g standard home roti
    oil_level = Column(String, default="moderate")   # "low", "moderate", "high"

    # User Profile & Goals
    display_name = Column(String, nullable=True)
    biological_sex = Column(SQLEnum(Sex), default=Sex.OTHER, nullable=False)
    goal_type = Column(SQLEnum(GoalType), default=GoalType.MAINTAIN, nullable=False)
    goal_rate_kg_week = Column(Float, default=0.0)   # e.g. -0.5 for loss, +0.25 for gain
    target_calories = Column(Float, default=2100.0)   # Updated by user or Zoro insight

    # Safety floor enforced by engine (kcal/day - based on sex)
    calorie_floor = Column(Float, default=1500.0)

    last_known_region = Column(String, nullable=True)  # Legal coarse IP tracking
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

