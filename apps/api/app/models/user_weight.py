from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class UserWeight(Base):
    """
    Stores daily morning weight logs for each user.
    The trend_weight column stores the EWMA-smoothed value computed on insert.
    """
    __tablename__ = "user_weights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date_logged = Column(Date, nullable=False, index=True)

    # Raw morning weight (kg)
    weight_kg = Column(Float, nullable=False)

    # EWMA-smoothed trend weight (alpha=0.25), computed on insert
    # Filters out glycogen, water, and sodium noise
    trend_weight = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
