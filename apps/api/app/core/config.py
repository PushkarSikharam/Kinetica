from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Calorie Tracker API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./calorie_tracker.db"

    # Security
    SECRET_KEY: str = "local-development-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"
    BACKEND_CORS_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+)(:\d+)?$"

    # AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-2.0-flash"
    AI_CHAT_RATE_LIMIT_COUNT: int = 20
    AI_CHAT_RATE_LIMIT_WINDOW_SECONDS: int = 300
    AI_MEAL_PARSE_RATE_LIMIT_COUNT: int = 15
    AI_MEAL_PARSE_RATE_LIMIT_WINDOW_SECONDS: int = 300

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
