"""initial schema

Revision ID: 20260508_0001
Revises:
Create Date: 2026-05-08 00:00:01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260508_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


user_role_enum = sa.Enum("USER", "ADMIN", name="userrole")
goal_type_enum = sa.Enum("LOSE", "MAINTAIN", "GAIN", name="goaltype")
sex_enum = sa.Enum("MALE", "FEMALE", "OTHER", name="sex")


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        user_role_enum.create(bind, checkfirst=True)
        goal_type_enum.create(bind, checkfirst=True)
        sex_enum.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
        sa.Column("katori_multiplier", sa.Float(), nullable=True),
        sa.Column("roti_multiplier", sa.Float(), nullable=True),
        sa.Column("oil_level", sa.String(), nullable=True),
        sa.Column("display_name", sa.String(), nullable=True),
        sa.Column("biological_sex", sex_enum, nullable=False),
        sa.Column("goal_type", goal_type_enum, nullable=False),
        sa.Column("goal_rate_kg_week", sa.Float(), nullable=True),
        sa.Column("target_calories", sa.Float(), nullable=True),
        sa.Column("calorie_floor", sa.Float(), nullable=True),
        sa.Column("last_known_region", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "foods",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("base_calories", sa.Float(), nullable=False),
        sa.Column("protein_g", sa.Float(), nullable=False),
        sa.Column("carbs_g", sa.Float(), nullable=False),
        sa.Column("fats_g", sa.Float(), nullable=False),
        sa.Column("fiber_g", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_foods")),
    )
    op.create_index(op.f("ix_foods_id"), "foods", ["id"], unique=False)
    op.create_index(op.f("ix_foods_name"), "foods", ["name"], unique=False)

    op.create_table(
        "daily_summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date_logged", sa.Date(), nullable=False),
        sa.Column("total_calories", sa.Float(), nullable=True),
        sa.Column("total_protein", sa.Float(), nullable=True),
        sa.Column("total_carbs", sa.Float(), nullable=True),
        sa.Column("total_fats", sa.Float(), nullable=True),
        sa.Column("daily_weight_kg", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_daily_summaries_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_daily_summaries")),
        sa.UniqueConstraint("user_id", "date_logged", name="uq_daily_summaries_user_id_date_logged"),
    )
    op.create_index(op.f("ix_daily_summaries_date_logged"), "daily_summaries", ["date_logged"], unique=False)
    op.create_index(op.f("ix_daily_summaries_id"), "daily_summaries", ["id"], unique=False)

    op.create_table(
        "meal_entries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("food_id", sa.Integer(), nullable=False),
        sa.Column("date_logged", sa.Date(), nullable=False),
        sa.Column("meal_type", sa.String(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False),
        sa.Column("unit_type", sa.String(), nullable=False),
        sa.Column("calculated_calories", sa.Float(), nullable=False),
        sa.Column("calculated_protein", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.ForeignKeyConstraint(["food_id"], ["foods.id"], name=op.f("fk_meal_entries_food_id_foods")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_meal_entries_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_meal_entries")),
    )
    op.create_index(op.f("ix_meal_entries_date_logged"), "meal_entries", ["date_logged"], unique=False)
    op.create_index(op.f("ix_meal_entries_id"), "meal_entries", ["id"], unique=False)

    op.create_table(
        "user_feedbacks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_feedbacks_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_feedbacks")),
    )
    op.create_index(op.f("ix_user_feedbacks_id"), "user_feedbacks", ["id"], unique=False)

    op.create_table(
        "user_weights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date_logged", sa.Date(), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=False),
        sa.Column("trend_weight", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_weights_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_weights")),
        sa.UniqueConstraint("user_id", "date_logged", name="uq_user_weights_user_id_date_logged"),
    )
    op.create_index(op.f("ix_user_weights_date_logged"), "user_weights", ["date_logged"], unique=False)
    op.create_index(op.f("ix_user_weights_id"), "user_weights", ["id"], unique=False)
    op.create_index(op.f("ix_user_weights_user_id"), "user_weights", ["user_id"], unique=False)

    op.create_table(
        "zoro_insights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("window_days", sa.Integer(), nullable=False),
        sa.Column("avg_intake_kcal", sa.Float(), nullable=False),
        sa.Column("observed_rate_kg_week", sa.Float(), nullable=False),
        sa.Column("maintenance_estimate_kcal", sa.Float(), nullable=False),
        sa.Column("recommended_adjustment_kcal", sa.Float(), nullable=False),
        sa.Column("new_target_kcal", sa.Float(), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("confidence_reasons", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("ai_explanation", sa.String(), nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_zoro_insights_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_zoro_insights")),
    )
    op.create_index(op.f("ix_zoro_insights_id"), "zoro_insights", ["id"], unique=False)
    op.create_index(op.f("ix_zoro_insights_user_id"), "zoro_insights", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_zoro_insights_user_id"), table_name="zoro_insights")
    op.drop_index(op.f("ix_zoro_insights_id"), table_name="zoro_insights")
    op.drop_table("zoro_insights")

    op.drop_index(op.f("ix_user_weights_user_id"), table_name="user_weights")
    op.drop_index(op.f("ix_user_weights_id"), table_name="user_weights")
    op.drop_index(op.f("ix_user_weights_date_logged"), table_name="user_weights")
    op.drop_table("user_weights")

    op.drop_index(op.f("ix_user_feedbacks_id"), table_name="user_feedbacks")
    op.drop_table("user_feedbacks")

    op.drop_index(op.f("ix_meal_entries_id"), table_name="meal_entries")
    op.drop_index(op.f("ix_meal_entries_date_logged"), table_name="meal_entries")
    op.drop_table("meal_entries")

    op.drop_index(op.f("ix_daily_summaries_id"), table_name="daily_summaries")
    op.drop_index(op.f("ix_daily_summaries_date_logged"), table_name="daily_summaries")
    op.drop_table("daily_summaries")

    op.drop_index(op.f("ix_foods_name"), table_name="foods")
    op.drop_index(op.f("ix_foods_id"), table_name="foods")
    op.drop_table("foods")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        sex_enum.drop(bind, checkfirst=True)
        goal_type_enum.drop(bind, checkfirst=True)
        user_role_enum.drop(bind, checkfirst=True)
