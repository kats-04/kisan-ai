import httpx
import logging
from typing import Optional
from datetime import datetime
from app.config import settings
from app.models.weather import WeatherData, ForecastDay, WeatherResponse
from app.ai import get_ai_provider, WEATHER_FARMING_PROMPT

logger = logging.getLogger(__name__)

WEATHER_ICONS = {
    "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "⛅",
    "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
}
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


async def get_weather(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    city: Optional[str] = None,
    language: str = "en"
) -> WeatherResponse:
    """Fetch live weather + generate AI farming recommendations"""
    try:
        if not settings.OPENWEATHER_API_KEY:
            logger.info("No OpenWeather key — using mock weather data")
            return await _get_mock_weather_with_ai(city or "Your Location", language)

        base_url = "https://api.openweathermap.org/data/2.5"
        params = {"appid": settings.OPENWEATHER_API_KEY, "units": "metric"}

        if lat and lon:
            params["lat"] = lat
            params["lon"] = lon
        elif city:
            params["q"] = f"{city},IN"
        else:
            params["q"] = "Delhi,IN"

        async with httpx.AsyncClient(timeout=15) as client:
            current_resp = await client.get(f"{base_url}/weather", params=params)
            current_resp.raise_for_status()
            current_data = current_resp.json()

            forecast_resp = await client.get(f"{base_url}/forecast", params=params)
            forecast_resp.raise_for_status()
            forecast_data = forecast_resp.json()

        location = current_data.get("name", city or "Unknown")
        weather = current_data["weather"][0]
        main = current_data["main"]
        wind = current_data.get("wind", {})

        current = WeatherData(
            temperature=round(main["temp"], 1),
            feels_like=round(main["feels_like"], 1),
            humidity=main["humidity"],
            wind_speed=round(wind.get("speed", 0) * 3.6, 1),
            wind_direction=wind.get("deg", 0),
            description=weather["description"].title(),
            icon=WEATHER_ICONS.get(weather["icon"], "🌤️"),
            pressure=main["pressure"],
            visibility=current_data.get("visibility", 10000) // 1000,
        )

        forecast = []
        seen_dates = set()
        for item in forecast_data.get("list", []):
            date_str = item["dt_txt"][:10]
            if date_str not in seen_dates and len(forecast) < 7:
                seen_dates.add(date_str)
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                w = item["weather"][0]
                m = item["main"]
                forecast.append(ForecastDay(
                    date=date_str,
                    day_name=DAY_NAMES[dt.weekday()],
                    temp_max=round(m["temp_max"], 1),
                    temp_min=round(m["temp_min"], 1),
                    humidity=m["humidity"],
                    wind_speed=round(item.get("wind", {}).get("speed", 0) * 3.6, 1),
                    description=w["description"].title(),
                    icon=WEATHER_ICONS.get(w["icon"], "🌤️"),
                    rain_probability=round(item.get("pop", 0) * 100),
                    rain_amount=item.get("rain", {}).get("3h", 0),
                ))

        alerts = _generate_farming_alerts(current, forecast)
        ai_recommendation = await _get_ai_recommendation(location, current, forecast, language)

        return WeatherResponse(
            location=location,
            current=current,
            forecast=forecast,
            farming_alerts=alerts,
            ai_recommendation=ai_recommendation,
        )

    except Exception as e:
        logger.error(f"Weather service error: {e}", exc_info=True)
        return await _get_mock_weather_with_ai(city or "Your Location", language)


async def _get_ai_recommendation(location: str, current: WeatherData, forecast: list, language: str) -> str:
    """Generate AI farming recommendations based on weather"""
    try:
        forecast_summary = "\n".join([
            f"- {f.day_name}: {f.description}, {f.temp_min}°C–{f.temp_max}°C, Rain: {f.rain_probability}%"
            for f in forecast[:5]
        ])

        prompt = WEATHER_FARMING_PROMPT.format(
            location=location,
            temperature=current.temperature,
            humidity=current.humidity,
            wind_speed=current.wind_speed,
            description=current.description,
            forecast_summary=forecast_summary,
            language=language
        )

        ai_provider = get_ai_provider()
        return await ai_provider.generate(prompt, language=language)
    except Exception as e:
        logger.error(f"Weather AI recommendation error: {e}")
        return "Weather data loaded. Add your Gemini API key for AI-powered farming recommendations."


def _generate_farming_alerts(current: WeatherData, forecast: list) -> list:
    alerts = []
    if current.humidity > 80:
        alerts.append("⚠️ High humidity — Risk of fungal diseases. Monitor crops closely.")
    if current.wind_speed > 30:
        alerts.append("💨 Strong winds — Avoid spraying pesticides or fertilizers today.")
    if current.temperature > 38:
        alerts.append("🌡️ Extreme heat — Irrigate crops in early morning or evening only.")
    if current.temperature < 10:
        alerts.append("❄️ Cold weather — Protect sensitive crops from frost damage.")
    for day in forecast[:3]:
        if day.rain_probability > 70:
            alerts.append(f"🌧️ Heavy rain expected on {day.day_name} — Complete field operations before then.")
            break
    if not alerts:
        alerts.append("✅ Weather conditions are favorable for farming activities today.")
    return alerts[:5]


async def _get_mock_weather_with_ai(location: str, language: str) -> WeatherResponse:
    """Return realistic mock weather with real AI recommendations"""
    current = WeatherData(
        temperature=29.5,
        feels_like=32.0,
        humidity=68,
        wind_speed=14.4,
        wind_direction=180,
        description="Partly Cloudy",
        icon="⛅",
        pressure=1012,
        visibility=10,
    )
    forecast = [
        ForecastDay(
            date=f"2024-05-{21+i:02d}",
            day_name=DAY_NAMES[(3 + i) % 7],
            temp_max=31 + i,
            temp_min=22 + i,
            humidity=65 + i * 2,
            wind_speed=12 + i,
            description="Partly Cloudy" if i % 2 == 0 else "Light Rain",
            icon="⛅" if i % 2 == 0 else "🌦️",
            rain_probability=20 + i * 8,
            rain_amount=0 if i % 2 == 0 else 2.5,
        )
        for i in range(7)
    ]
    alerts = _generate_farming_alerts(current, forecast)
    ai_recommendation = await _get_ai_recommendation(location, current, forecast, language)

    return WeatherResponse(
        location=f"{location} (Demo Data — Add OpenWeather API key for live data)",
        current=current,
        forecast=forecast,
        farming_alerts=alerts,
        ai_recommendation=ai_recommendation,
    )
