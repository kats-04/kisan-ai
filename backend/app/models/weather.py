from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WeatherRequest(BaseModel):
    lat: Optional[float] = None
    lon: Optional[float] = None
    city: Optional[str] = None
    state: Optional[str] = None
    language: str = "en"


class WeatherData(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    wind_speed: float
    wind_direction: int
    description: str
    icon: str
    pressure: int
    visibility: int
    uv_index: Optional[float] = None


class ForecastDay(BaseModel):
    date: str
    day_name: str
    temp_max: float
    temp_min: float
    humidity: int
    wind_speed: float
    description: str
    icon: str
    rain_probability: float
    rain_amount: Optional[float] = None


class WeatherResponse(BaseModel):
    location: str
    current: WeatherData
    forecast: List[ForecastDay] = []
    farming_alerts: List[str] = []
    ai_recommendation: str
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
