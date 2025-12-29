# src/tools/price_tool.py
import os
from langchain_core.tools import tool
from tavily import TavilyClient
import logging

logger = logging.getLogger(__name__)

@tool
def verify_market_price(service_name: str, vehicle_info: str, location: str) -> str:
    """
    Searches online for current market rates of vehicle repairs or medical procedures 
    to validate if a claim amount is inflated.
    
    Args:
        service_name: The specific repair or service (e.g., "front bumper replacement", "root canal").
        vehicle_info: Car model/make or 'N/A' for health claims (e.g., "Renault Duster").
        location: City or region (e.g., "Pune").
    """
    try:
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            logger.error("TAVILY_API_KEY not set in environment variables")
            return "Market price verification unavailable: API key not configured"
        
        tavily = TavilyClient(api_key=api_key)
        
        # Construct a targeted search query
        query = f"average cost of {service_name} for {vehicle_info} in {location} price estimate"
        if vehicle_info == "N/A":
            query = f"average cost of {service_name} in {location} price"

        logger.info(f"Searching market prices: {query}")
        
        # Search with Tavily
        response = tavily.search(query=query, search_depth="basic", max_results=4)
        
        # Format the results for the LLM to analyze
        results_text = "\n".join([
            f"- Source: {r['url']}\n  Snippet: {r['content']}" 
            for r in response.get('results', [])
        ])
        
        if not results_text:
            return f"No market price data found for '{query}'"
        
        return f"Market Price Search Results for '{query}':\n\n{results_text}"

    except Exception as e:
        logger.error(f"Price tool error: {e}")
        return f"Failed to fetch market prices: {str(e)}"
