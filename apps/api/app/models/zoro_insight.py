from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class ZoroInsight(Base):
    """
    Stores computed Adaptive TDEE Engine output for each user.
    Created by the TDEE engine. Applied only when user explicitly confirms.
    """
    __tablename__ = "zoro_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Which analysis window was used
    window_days = Column(Integer, nullable=False)  # 21 or 28

    # Engine outputs
    avg_intake_kcal = Column(Float, nullable=False)
    observed_rate_kg_week = Column(Float, nullable=False)
    maintenance_estimate_kcal = Column(Float, nullable=False)
    recommended_adjustment_kcal = Column(Float, nullable=False)  # clamped ±150
    new_target_kcal = Column(Float, nullable=False)  # current_target + adjustment

    # Confidence
    confidence_score = Column(Float, nullable=False)  # 0.0 – 1.0
    confidence_reasons = Column(JSON, nullable=True)   # list of strings

    # Status lifecycle: pending_review → applied | dismissed
    status = Column(String, default="pending_review", nullable=False)

    # AI-generated natural-language explanation
    ai_explanation = Column(String, nullable=True)

    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
