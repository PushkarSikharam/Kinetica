from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Calorie Tracker API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE
    # Using SQLite for local development out of the box
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./calorie_tracker.db"
    
    # SECRETS
    # TODO: Change in production
    SECRET_KEY: str = "super_secret_key_change_me_in_production_123!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AI 
    GEMINI_API_KEY: str = "AQ.Ab8RN6J7a5Yz8Owa6lqFklf2nMV3_JAiic_KQ-LNrZxUg3PG7A"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
