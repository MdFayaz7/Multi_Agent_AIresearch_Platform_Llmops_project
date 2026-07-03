from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, users, research
from app.config import settings
from app.database import init_indexes

app = FastAPI(title="Multi-Agent Research Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(research.router)


@app.on_event("startup")
async def on_startup():
    await init_indexes()


@app.get("/api/health")
async def health():
    return {"status": "ok"}
