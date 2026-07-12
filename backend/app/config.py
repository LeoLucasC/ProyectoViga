from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:Lucas2201@127.0.0.1:5432/vigamonitor"
    ws_host: str = "0.0.0.0"
    ws_port: int = 8000
    cors_origins: str = "*"

    @property
    def database_dsn(self) -> str:
        """Convert SQLAlchemy URL to asyncpg DSN."""
        return self.database_url.replace("postgresql://", "postgresql://")


settings = Settings()
