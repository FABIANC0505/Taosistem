import os

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "root"
    MYSQL_DB: str = "bdtaosistem"
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_URL: str | None = None
    MYSQLHOST: str | None = None
    MYSQLPORT: int | None = None
    MYSQLUSER: str | None = None
    MYSQLPASSWORD: str | None = None
    MYSQLDATABASE: str | None = None
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 480
    JWT_REFRESH_EXPIRE_DAYS: int = 30
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    DATABASE_URL: str | None = None
    CORS_ORIGINS: str | None = None
    STORAGE_BACKEND: str = "local"
    LOCAL_UPLOAD_DIR: str = "uploads"
    R2_ACCOUNT_ID: str | None = None
    R2_ACCESS_KEY_ID: str | None = None
    R2_SECRET_ACCESS_KEY: str | None = None
    R2_BUCKET_NAME: str | None = None
    R2_PUBLIC_BASE_URL: str | None = None

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            db_url = self.DATABASE_URL
        # En desarrollo permitimos usar SQLite local para evitar depender de MySQL
        use_sqlite = os.getenv("USE_SQLITE", "1").lower() in ("1", "true", "yes")
        if self.APP_ENV == "development" and use_sqlite and not self.DATABASE_URL:
            sqlite_path = os.getenv("SQLITE_PATH", "dev.db")
            return f"sqlite+aiosqlite:///{sqlite_path}"
        elif self.MYSQL_URL:
            db_url = self.MYSQL_URL
        elif self.MYSQLHOST and self.MYSQLUSER and self.MYSQLDATABASE:
            mysql_password = self.MYSQLPASSWORD or ""
            mysql_port = self.MYSQLPORT or 3306
            db_url = (
                f"mysql://{self.MYSQLUSER}:{mysql_password}"
                f"@{self.MYSQLHOST}:{mysql_port}/{self.MYSQLDATABASE}"
            )
        else:
            return (
                f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
                f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
            )
        if db_url.startswith("mysql://"):
            db_url = db_url.replace("mysql://", "mysql+aiomysql://", 1)
        if db_url.startswith("mysql+pymysql://"):
            db_url = db_url.replace("mysql+pymysql://", "mysql+aiomysql://", 1)
        if db_url.startswith("postgres://"):
            raise ValueError("La configuracion actual del proyecto espera MySQL 8, no PostgreSQL.")
        if db_url.startswith("postgresql://"):
            raise ValueError("La configuracion actual del proyecto espera MySQL 8, no PostgreSQL.")
        return db_url

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

    @property
    def is_r2_enabled(self) -> bool:
        return self.STORAGE_BACKEND.lower() == "r2"

    @property
    def r2_endpoint_url(self) -> str:
        if not self.R2_ACCOUNT_ID:
            raise ValueError("R2_ACCOUNT_ID no configurado")
        return f"https://{self.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    @property
    def is_vercel_deployment(self) -> bool:
        return os.getenv("VERCEL", "").lower() in {"1", "true", "yes"}

    @property
    def should_init_db_on_startup(self) -> bool:
        return not self.is_vercel_deployment

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
