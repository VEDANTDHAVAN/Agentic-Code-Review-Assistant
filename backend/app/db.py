from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def normalize_database_url(database_url: str) -> str | URL:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def make_engine():
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required for SQLAlchemy storage.")
    return create_engine(normalize_database_url(settings.database_url), pool_pre_ping=True)


engine = make_engine() if get_settings().database_url else None
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False) if engine else None
