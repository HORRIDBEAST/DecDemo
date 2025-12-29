# src/tools/weather_tool.py
import httpx
import logging
from langchain_core.tools import tool
from datetime import datetime

logger = logging.getLogger(__name__)

@tool
async def verify_historical_weather(location: str, date: str) -> str:
    """
    Retrieves historical weather data for a specific location and date to verify insurance claims.
    Useful for checking if it was actually raining, storming, or sunny on the incident date.
    
    Args:
        location: The city or address (e.g., "Pune", "New York").
        date: The date in YYYY-MM-DD format.
    """
    try:
        async with httpx.AsyncClient() as client:
            # 1. Geocoding (Convert Location to Lat/Long)
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            geo_res = await client.get(geo_url, params={"name": location, "count": 1, "format": "json"})
            geo_data = geo_res.json()

            if not geo_data.get("results"):
                # Fallback: Try extracting just the city name if full address fails
                # e.g., "Bhumkar Chowk, Pune" -> "Pune"
                if ',' in location:
                    fallback_location = location.split(',')[-1].strip()
                    logger.info(f"Location '{location}' not found, trying fallback: '{fallback_location}'")
                    geo_res = await client.get(geo_url, params={"name": fallback_location, "count": 1, "format": "json"})
                    geo_data = geo_res.json()
                    
                    if not geo_data.get("results"):
                        return f"Could not find coordinates for location: {location} or {fallback_location}"
                    location = fallback_location  # Update location name for report
                else:
                    return f"Could not find coordinates for location: {location}"

            lat = geo_data["results"][0]["latitude"]
            lon = geo_data["results"][0]["longitude"]

            # 2. Weather Lookup (Historical)
            weather_url = "https://archive-api.open-meteo.com/v1/archive"
            weather_params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": date,
                "end_date": date,
                "daily": ["weather_code", "precipitation_sum", "wind_speed_10m_max"],
                "timezone": "auto"
            }
            
            w_res = await client.get(weather_url, params=weather_params)
            w_data = w_res.json()

            if "daily" not in w_data:
                return f"No weather data found for {date}"

            # 3. Interpret Data
            precip = w_data["daily"]["precipitation_sum"][0]
            wind = w_data["daily"]["wind_speed_10m_max"][0]
            code = w_data["daily"]["weather_code"][0]

            # WMO Weather Codes interpretation
            condition = "Clear/Cloudy"
            if code >= 51 and code <= 67: 
                condition = "Rain"
            elif code >= 71 and code <= 77: 
                condition = "Snow"
            elif code >= 80 and code <= 82: 
                condition = "Heavy Showers"
            elif code >= 95: 
                condition = "Thunderstorm"

            report = (
                f"Weather Report for {location} on {date}:\n"
                f"- Condition: {condition} (Code: {code})\n"
                f"- Precipitation: {precip} mm\n"
                f"- Max Wind Speed: {wind} km/h"
            )
            return report

    except Exception as e:
        logger.error(f"Weather tool error: {e}")
        return f"Failed to fetch weather data: {str(e)}"
