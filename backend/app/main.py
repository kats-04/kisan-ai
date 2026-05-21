import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.views import auth_router, chat_router, weather_router, crop_router, market_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("motor").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"AI Provider: {settings.DEFAULT_AI_PROVIDER}")
    logger.info(f"Gemini key set: {bool(settings.GEMINI_API_KEY)}")
    await connect_to_mongo()
    yield
    await close_mongo_connection()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## 🌾 KrishiMitra – AI Farmer Advisory Copilot

A production-ready AI-powered agritech platform helping Indian farmers make smarter decisions.

### Features:
- 🤖 **AI Copilot Chat** – Multilingual farming advice (English, Hindi, Kannada)
- 🌤️ **Weather Intelligence** – Live weather + AI farming recommendations
- 🌱 **Crop Recommendations** – AI-powered crop selection engine
- 🔬 **Disease Detection** – Gemini Vision crop disease analysis
- 📊 **Market Prices** – Mandi prices with AI sell/hold advice
- 🏛️ **Government Schemes** – Simplified scheme information

### Authentication:
Use Bearer token from `/api/v1/auth/login` endpoint.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."}
    )


API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(chat_router, prefix=API_PREFIX)
app.include_router(weather_router, prefix=API_PREFIX)
app.include_router(crop_router, prefix=API_PREFIX)
app.include_router(market_router, prefix=API_PREFIX)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.DEFAULT_AI_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }
