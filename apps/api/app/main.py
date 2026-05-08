from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

# Import models here to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.food import Food
from app.models.meal import MealEntry, DailySummary
from app.models.feedback import UserFeedback
from app.models.user_weight import UserWeight
from app.models.zoro_insight import ZoroInsight

# Auto-create tables for local development with SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
from app.api import auth, chat, feedback, foods, insights, meals, users, weight

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.5.71:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(foods.router, prefix=f"{settings.API_V1_STR}/foods", tags=["foods"])
app.include_router(meals.router, prefix=f"{settings.API_V1_STR}/meals", tags=["meals"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/ai/chat", tags=["ai"])
app.include_router(weight.router, prefix=f"{settings.API_V1_STR}/weight", tags=["weight"])
app.include_router(insights.router, prefix=f"{settings.API_V1_STR}/insights", tags=["insights"])
app.include_router(feedback.router, prefix=f"{settings.API_V1_STR}/feedback", tags=["feedback"])

@app.get("/")
def root():
    return {"message": "Calorie Tracker API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
