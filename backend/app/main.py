from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.github import router as github_router
from app.api.review import router as review_router
from app.api.auth import router as auth_router
from app.api.user import router as user_router
from app.core.config import get_settings, validate_production_config

settings = get_settings()
validate_production_config()

app = FastAPI(title=settings.app_name)


def cors_origins() -> list[str]:
    if settings.env == "production":
        return [settings.frontend_url]
    return [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(github_router)
app.include_router(review_router)
app.include_router(auth_router)
app.include_router(user_router)


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.env, "version": settings.app_version}
