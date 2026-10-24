from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.api.routes import router as api_router
from backend.app.services.dataset_service import DatasetService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and default dataset are loaded
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        DatasetService.get_instance().initialize(db)
    finally:
        db.close()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Privacy-preserving academic attendance intelligence platform.",
    lifespan=lifespan
)

# Restrictive Development CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
