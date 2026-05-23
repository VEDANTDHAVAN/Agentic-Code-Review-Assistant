from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.github import router as github_router
from app.api.review import router as review_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(github_router)
app.include_router(review_router)


@app.get("/health")
async def health():
    return {"ok": True, "service": settings.app_name}
