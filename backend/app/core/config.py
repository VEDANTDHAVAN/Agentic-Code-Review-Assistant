from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


APP_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    app_name: str = "Agentic Code Review Assistant"
    app_version: str = "0.1.0"
    env: str = "development"
    backend_url: str = "http://localhost:8000"
    database_path: str = "data/reviews.db"
    database_url: str | None = None
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    demo_mode: bool = False
    github_auth_mode: str = "clerk_oauth"
    github_webhook_secret: str | None = None
    clerk_secret_key: str | None = None
    clerk_jwks_url: str | None = None
    app_encryption_key: str | None = None
    default_ai_provider: str = "openai"
    default_openai_model: str = "gpt-4o-mini"
    default_openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_api_key: str | None = None
    openrouter_app_url: str = "http://localhost:3000"
    openrouter_app_name: str = "PRism AI"
    github_oauth_client_id: str | None = None
    github_oauth_client_secret: str | None = None
    github_oauth_callback_url: str = "http://localhost:8000/auth/github/callback"
    session_cookie_name: str = "acra_session"
    session_secret_key: str = "dev-session-secret-change-me"
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    anthropic_api_key: str | None = None
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=(
            PROJECT_ROOT / ".env",
            BACKEND_DIR / ".env",
            Path.cwd() / ".env",
        ),
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


def is_github_app_mode() -> bool:
    return get_settings().github_auth_mode == "github_app"


def is_production() -> bool:
    return get_settings().env == "production"


def validate_production_config() -> None:
    settings = get_settings()
    if not is_production():
        return
    missing = []
    if not settings.database_url:
        missing.append("DATABASE_URL")
    if not settings.frontend_url:
        missing.append("FRONTEND_URL")
    if not settings.app_encryption_key:
        missing.append("APP_ENCRYPTION_KEY")
    if not settings.clerk_secret_key:
        missing.append("CLERK_SECRET_KEY")
    if missing:
        raise RuntimeError(f"Missing required production environment variables: {', '.join(missing)}")
