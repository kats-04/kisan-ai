from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.services.weather_service import get_weather
from app.middleware import get_optional_user

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])


@router.get("/", summary="Get weather data and farming recommendations")
async def weather(
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    city: Optional[str] = Query(None, description="City name"),
    state: Optional[str] = Query(None, description="State name"),
    language: str = Query("en", description="Response language (en/hi/kn)"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    # Use user's location if available
    if current_user and not city and not lat:
        profile = current_user.get("profile", {})
        city = profile.get("district") or profile.get("state")

    return await get_weather(lat=lat, lon=lon, city=city, language=language)
