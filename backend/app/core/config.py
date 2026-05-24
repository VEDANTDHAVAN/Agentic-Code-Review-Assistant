from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Agentic Code Review Assistant"
    database_path: str = "data/reviews.db"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    demo_mode: bool = False
    github_oauth_client_id: str | None = None
    github_oauth_client_secret: str | None = None
    github_oauth_callback_url: str = "http://localhost:8000/auth/github/callback"
    session_cookie_name: str = "acra_session"
    session_secret_key: str = "dev-session-secret-change-me"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    anthropic_api_key: str | None = None
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
