from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    POSTGRES_USER: str = "restautech_user"
    POSTGRES_PASSWORD: str = "restautech_pass_2026"
    POSTGRES_DB: str = "restautech_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 480
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    DATABASE_URL: str | None = None
    CORS_ORIGINS: str | None = None

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            db_url = self.DATABASE_URL
            if db_url.startswith("postgres://"):
                db_url = db_url.replace("postgres://", "postgresql://", 1)
            if db_url.startswith("postgresql://"):
                db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return db_url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def cors_origins_list(self) -> list[str]:
        if self.CORS_ORIGINS:
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            self.FRONTEND_URL,
        ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
