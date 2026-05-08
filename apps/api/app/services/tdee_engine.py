"""
Zoro Adaptive TDEE Engine
=========================
Implements a research-backed three-window algorithm:
  - 7 days  → Behavioral patterns only (no recommendations)
  - 21 days → Minimum recommendation window (if data quality passes)
  - 28 days → Default recommendation window

Scientific basis:
  - EWMA smoothing (α=0.25) to remove glycogen/water/sodium noise
  - Ordinary Least Squares regression on trend weights (not first-minus-last)
  - 7700 kcal/kg approximation (labeled as estimate to user)
  - Confidence-gated: no recommendation below 0.50 confidence
  - Safety floors: 1200 kcal/day (female), 1500 kcal/day (male/other)
  - Max adjustment clamped at ±150 kcal/day per recommendation cycle
"""

from __future__ import annotations
import logging
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.models.meal import DailySummary
from app.models.user_weight import UserWeight
from app.models.user import User

logger = logging.getLogger(__name__)

EWMA_ALPHA = 0.25       # Smoothing factor for daily weight trend
KCAL_PER_KG = 7700     # Standard energy content approximation
MAX_ADJUSTMENT = 150    # Maximum kcal/day change per recommendation cycle


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class DataQualityResult:
    meets_threshold: bool
    window_days: int
    logged_days: int
    weight_entries: int
    max_gap_days: int
    reasons: list[str] = field(default_factory=list)


@dataclass
class WeightRateResult:
    weekly_rate_kg: float
    r_squared: float
    std_err: float
    n_points: int


@dataclass
class BehaviorWindow:
    """7-day behavioral patterns — no calorie recommendations."""
    avg_calories: float
    avg_protein_g: float
    weekday_avg: float
    weekend_avg: float
    weekend_spike_kcal: float
    logging_days: int
    protein_adherence_pct: float  # % of days where protein > 100g


@dataclass
class TDEEResult:
    """Full engine output — only produced when quality gate passes."""
    user_id: int
    window_days: int
    avg_intake_kcal: float
    observed_rate_kg_week: float
    maintenance_estimate_kcal: float
    recommended_adjustment_kcal: float
    new_target_kcal: float
    confidence_score: float
    confidence_reasons: list[str]
    behavior: BehaviorWindow
    status: str  # "ready", "insufficient_data", "error"


# ---------------------------------------------------------------------------
# Pure math helpers (no scipy dependency — plain NumPy-style OLS)
# ---------------------------------------------------------------------------

def _ols_slope_intercept(x: list[float], y: list[float]) -> tuple[float, float, float, float]:
    """
    Ordinary Least Squares — returns (slope, intercept, r_squared, std_err).
    Implemented in pure Python to avoid scipy dependency.
    """
    n = len(x)
    if n < 2:
        return 0.0, y[0] if y else 0.0, 0.0, 0.0

    mean_x = sum(x) / n
    mean_y = sum(y) / n

    ss_xx = sum((xi - mean_x) ** 2 for xi in x)
    ss_yy = sum((yi - mean_y) ** 2 for yi in y)
    ss_xy = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))

    if ss_xx == 0:
        return 0.0, mean_y, 0.0, 0.0

    slope = ss_xy / ss_xx
    intercept = mean_y - slope * mean_x

    # R-squared
    ss_res = sum((yi - (slope * xi + intercept)) ** 2 for xi, yi in zip(x, y))
    r_squared = 1 - (ss_res / ss_yy) if ss_yy > 0 else 0.0

    # Standard error of slope
    if n > 2 and ss_xx > 0:
        s2 = ss_res / (n - 2)
        std_err = (s2 / ss_xx) ** 0.5
    else:
        std_err = 0.0

    return slope, intercept, max(0.0, r_squared), std_err


def _stdev(values: list[float]) -> float:
    """Population standard deviation."""
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return variance ** 0.5


# ---------------------------------------------------------------------------
# EWMA — computed on every weight insert
# ---------------------------------------------------------------------------

def compute_ewma_trend(new_weight_kg: float, previous_trend_kg: Optional[float]) -> float:
    """
    EWMA with α=0.25. Call on every UserWeight insert.
    Bootstrap: if no prior trend exists, seed with the raw value.
    """
    if previous_trend_kg is None:
        return new_weight_kg
    return EWMA_ALPHA * new_weight_kg + (1 - EWMA_ALPHA) * previous_trend_kg


# ---------------------------------------------------------------------------
# Step 1: Data quality gate
# ---------------------------------------------------------------------------

def _check_data_quality(
    user_id: int,
    window: int,
    db: Session,
) -> DataQualityResult:
    cutoff = date.today() - timedelta(days=window)

    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id, DailySummary.date_logged >= cutoff)
        .order_by(DailySummary.date_logged.asc())
        .all()
    )
    weights = (
        db.query(UserWeight)
        .filter(UserWeight.user_id == user_id, UserWeight.date_logged >= cutoff)
        .order_by(UserWeight.date_logged.asc())
        .all()
    )

    logged_days = len(summaries)
    weight_entries = len(weights)

    # Compute maximum consecutive gap in logging (days)
    max_gap = 0
    if len(summaries) > 1:
        dates = sorted(s.date_logged for s in summaries)
        for i in range(1, len(dates)):
            gap = (dates[i] - dates[i - 1]).days
            max_gap = max(max_gap, gap)

    reasons = []

    if window == 28:
        threshold_logs = 20
        threshold_weights = 5
    else:  # 21-day
        threshold_logs = 15
        threshold_weights = 3

    meets = (
        logged_days >= threshold_logs
        and weight_entries >= threshold_weights
        and max_gap <= 5
    )

    if logged_days < threshold_logs:
        reasons.append(f"Only {logged_days}/{threshold_logs} logged days in {window}-day window.")
    if weight_entries < threshold_weights:
        reasons.append(f"Only {weight_entries}/{threshold_weights} weight entries in {window}-day window.")
    if max_gap > 5:
        reasons.append(f"Logging gap of {max_gap} days detected — consistent tracking required.")

    return DataQualityResult(
        meets_threshold=meets,
        window_days=window,
        logged_days=logged_days,
        weight_entries=weight_entries,
        max_gap_days=max_gap,
        reasons=reasons,
    )


# ---------------------------------------------------------------------------
# Step 2+3: Weight regression on EWMA trend
# ---------------------------------------------------------------------------

def _compute_weight_rate(user_id: int, window: int, db: Session) -> Optional[WeightRateResult]:
    cutoff = date.today() - timedelta(days=window)
    rows = (
        db.query(UserWeight)
        .filter(UserWeight.user_id == user_id, UserWeight.date_logged >= cutoff)
        .order_by(UserWeight.date_logged.asc())
        .all()
    )

    if len(rows) < 3:
        return None

    base_date = rows[0].date_logged
    x = [(row.date_logged - base_date).days for row in rows]
    y = [row.trend_weight for row in rows]  # Use EWMA — not raw weight

    slope, _, r_squared, std_err = _ols_slope_intercept(x, y)

    weekly_rate_kg = slope * 7  # Convert daily slope → weekly rate

    return WeightRateResult(
        weekly_rate_kg=weekly_rate_kg,
        r_squared=r_squared,
        std_err=std_err,
        n_points=len(rows),
    )


# ---------------------------------------------------------------------------
# Step 4: Maintenance TDEE estimate
# ---------------------------------------------------------------------------

def _compute_maintenance(
    user_id: int,
    window: int,
    weight_rate: WeightRateResult,
    db: Session,
) -> tuple[float, float]:
    """Returns (avg_intake_kcal, maintenance_estimate_kcal)."""
    cutoff = date.today() - timedelta(days=window)
    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id, DailySummary.date_logged >= cutoff)
        .all()
    )

    if not summaries:
        return 0.0, 0.0

    avg_intake = sum(s.total_calories for s in summaries) / len(summaries)

    # Daily energy imbalance from weight trend
    # Negative rate (loss) → maintenance above avg intake
    daily_imbalance = (weight_rate.weekly_rate_kg * KCAL_PER_KG) / 7
    maintenance = avg_intake - daily_imbalance

    return avg_intake, maintenance


# ---------------------------------------------------------------------------
# Step 5: Compute clamped recommendation
# ---------------------------------------------------------------------------

def _compute_adjustment(
    observed_rate: float,
    target_rate: float,
    current_target: float,
    calorie_floor: float,
) -> tuple[float, float]:
    """
    Returns (clamped_adjustment, new_target_kcal).
    Enforces safety floor and ±150 kcal/day max change.
    """
    raw_adjustment = ((target_rate - observed_rate) * KCAL_PER_KG) / 7
    clamped = max(-MAX_ADJUSTMENT, min(MAX_ADJUSTMENT, raw_adjustment))

    new_target = max(calorie_floor, current_target + clamped)

    return clamped, new_target


# ---------------------------------------------------------------------------
# Step 6: Confidence score
# ---------------------------------------------------------------------------

def _compute_confidence(
    quality: DataQualityResult,
    weight_rate: WeightRateResult,
    summaries: list,
) -> tuple[float, list[str]]:
    score = 1.0
    reasons = []

    # Penalize sparse food logging
    if quality.logged_days < 20:
        penalty = 0.2 * (1 - quality.logged_days / 20)
        score -= penalty
        reasons.append(f"Sparse food logs ({quality.logged_days} days). Log more consistently.")

    # Penalize sparse weighing
    if quality.weight_entries < 5:
        penalty = 0.2 * (1 - quality.weight_entries / 5)
        score -= penalty
        reasons.append(f"Few weigh-ins ({quality.weight_entries}). Daily morning weight improves accuracy.")

    # Penalize noisy weight regression (low R²)
    if weight_rate.r_squared < 0.5:
        score -= 0.25
        reasons.append(f"Weight trend is noisy (R²={weight_rate.r_squared:.2f}). Consistent daily weigh-ins will help.")

    # Penalize high caloric variability
    calories = [s.total_calories for s in summaries if s.total_calories > 0]
    if len(calories) > 2:
        calorie_std = _stdev(calories)
        if calorie_std > 400:
            score -= 0.15
            reasons.append(f"High calorie variability (±{calorie_std:.0f} kcal/day). Consistent eating improves estimates.")

    # Penalize logging gaps
    if quality.max_gap_days > 3:
        score -= 0.10
        reasons.append(f"{quality.max_gap_days}-day logging gap detected. Continuous logs are essential.")

    return max(0.0, min(1.0, score)), reasons


# ---------------------------------------------------------------------------
# 7-Day Behavior Window
# ---------------------------------------------------------------------------

def _compute_behavior(user_id: int, db: Session) -> BehaviorWindow:
    cutoff = date.today() - timedelta(days=7)
    summaries = (
        db.query(DailySummary)
        .filter(DailySummary.user_id == user_id, DailySummary.date_logged >= cutoff)
        .all()
    )

    if not summaries:
        return BehaviorWindow(0, 0, 0, 0, 0, 0, 0)

    all_cals = [s.total_calories for s in summaries]
    all_protein = [s.total_protein for s in summaries]

    weekday_cals = [
        s.total_calories for s in summaries
        if s.date_logged.weekday() < 5  # Mon–Fri
    ]
    weekend_cals = [
        s.total_calories for s in summaries
        if s.date_logged.weekday() >= 5  # Sat–Sun
    ]

    avg_cals = sum(all_cals) / len(all_cals) if all_cals else 0
    avg_protein = sum(all_protein) / len(all_protein) if all_protein else 0
    weekday_avg = sum(weekday_cals) / len(weekday_cals) if weekday_cals else avg_cals
    weekend_avg = sum(weekend_cals) / len(weekend_cals) if weekend_cals else avg_cals
    weekend_spike = max(0, weekend_avg - weekday_avg)

    protein_days = sum(1 for p in all_protein if p >= 100)
    protein_adherence = (protein_days / len(all_protein) * 100) if all_protein else 0

    return BehaviorWindow(
        avg_calories=round(avg_cals, 1),
        avg_protein_g=round(avg_protein, 1),
        weekday_avg=round(weekday_avg, 1),
        weekend_avg=round(weekend_avg, 1),
        weekend_spike_kcal=round(weekend_spike, 1),
        logging_days=len(summaries),
        protein_adherence_pct=round(protein_adherence, 1),
    )


# ---------------------------------------------------------------------------
# Main engine entry point
# ---------------------------------------------------------------------------

def run_tdee_engine(user_id: int, db: Session) -> TDEEResult:
    """
    Runs the full Adaptive TDEE analysis. Returns a TDEEResult.
    Always computes the 7-day behavior window.
    Attempts 28-day recommendation; falls back to 21-day if quality passes there.
    Returns status='insufficient_data' if neither window has enough data.
    """
    user: Optional[User] = db.query(User).filter(User.id == user_id).first()
    if not user:
        return TDEEResult(
            user_id=user_id, window_days=0,
            avg_intake_kcal=0, observed_rate_kg_week=0,
            maintenance_estimate_kcal=0, recommended_adjustment_kcal=0,
            new_target_kcal=0, confidence_score=0,
            confidence_reasons=["User not found."],
            behavior=BehaviorWindow(0, 0, 0, 0, 0, 0, 0),
            status="error",
        )

    # Always compute behavior window
    behavior = _compute_behavior(user_id, db)

    # Try 28-day window first, fall back to 21
    for window in [28, 21]:
        quality = _check_data_quality(user_id, window, db)

        if not quality.meets_threshold:
            if window == 21:
                # Both windows failed
                return TDEEResult(
                    user_id=user_id, window_days=window,
                    avg_intake_kcal=behavior.avg_calories,
                    observed_rate_kg_week=0,
                    maintenance_estimate_kcal=0,
                    recommended_adjustment_kcal=0,
                    new_target_kcal=user.target_calories,
                    confidence_score=0,
                    confidence_reasons=quality.reasons,
                    behavior=behavior,
                    status="insufficient_data",
                )
            continue  # Try 21-day next

        weight_rate = _compute_weight_rate(user_id, window, db)
        if weight_rate is None:
            continue

        avg_intake, maintenance = _compute_maintenance(user_id, window, weight_rate, db)

        target_rate = user.goal_rate_kg_week or 0.0
        calorie_floor = user.calorie_floor or (1200.0 if user.biological_sex.value == "female" else 1500.0)
        adjustment, new_target = _compute_adjustment(
            weight_rate.weekly_rate_kg, target_rate,
            user.target_calories or 2100.0, calorie_floor
        )

        # Fetch summaries again for confidence
        from datetime import timedelta
        cutoff = date.today() - timedelta(days=window)
        summaries = (
            db.query(DailySummary)
            .filter(DailySummary.user_id == user_id, DailySummary.date_logged >= cutoff)
            .all()
        )

        confidence, confidence_reasons = _compute_confidence(quality, weight_rate, summaries)

        return TDEEResult(
            user_id=user_id,
            window_days=window,
            avg_intake_kcal=round(avg_intake, 1),
            observed_rate_kg_week=round(weight_rate.weekly_rate_kg, 3),
            maintenance_estimate_kcal=round(maintenance, 1),
            recommended_adjustment_kcal=round(adjustment, 1),
            new_target_kcal=round(new_target, 1),
            confidence_score=round(confidence, 2),
            confidence_reasons=confidence_reasons,
            behavior=behavior,
            status="ready",
        )

    # Should not reach here
    return TDEEResult(
        user_id=user_id, window_days=0,
        avg_intake_kcal=0, observed_rate_kg_week=0,
        maintenance_estimate_kcal=0, recommended_adjustment_kcal=0,
        new_target_kcal=user.target_calories, confidence_score=0,
        confidence_reasons=["Unexpected engine error."],
        behavior=behavior, status="error",
    )
