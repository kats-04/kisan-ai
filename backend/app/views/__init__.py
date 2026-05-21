from .auth_routes import router as auth_router
from .chat_routes import router as chat_router
from .weather_routes import router as weather_router
from .crop_routes import router as crop_router
from .market_routes import router as market_router

__all__ = ["auth_router", "chat_router", "weather_router", "crop_router", "market_router"]
