from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class UserWeight(Base):
    """
    Stores daily morning weight logs for each user.
    The trend_weight column stores the EWMA-smoothed value computed on insert.
    """
    __tablename__ = "user_weights"
    __table_args__ = (
        UniqueConstraint("user_id", "date_logged", name="uq_user_weights_user_id_date_logged"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date_logged = Column(Date, nullable=False, index=True)

    # Raw morning weight (kg)
    weight_kg = Column(Float, nullable=False)

    # EWMA-smoothed trend weight (alpha=0.25), computed on insert
    # Filters out glycogen, water, and sodium noise
    trend_weight = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
