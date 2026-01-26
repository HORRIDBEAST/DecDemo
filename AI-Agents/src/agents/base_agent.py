from abc import ABC, abstractmethod
from langchain_openai import ChatOpenAI
from langsmith import traceable
import logging
from datetime import datetime
import os
import base64
import requests
from io import BytesIO
from PIL import Image
import imagehash
from typing import Dict, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    def __init__(self, name: str, model_provider: str = "openai"):
        self.name = name
        # Initialize OpenAI with Vision capabilities
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", 
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        
        # Initialize Supabase for Historical Checks
        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if url and key:
            self.supabase: Client = create_client(url, key)
        else:
            self.supabase = None
            logger.warning(f"{name}: Supabase credentials missing")

        self.system_prompt = f"You are a {name} agent for insurance claim processing."
        logger.info(f"{name} agent initialized with {model_provider}")

    @traceable
    async def health_check(self):
        return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

    def _create_agent_report(self, confidence: float, findings: dict, processing_time: float) -> dict:
        return {
            "confidence": confidence, 
            "findings": findings, 
            "processing_time": processing_time,
            "agent_name": self.name
        }

    # ==================== VISION UTILITIES ====================
    def _encode_image_from_url(self, image_url: str) -> Optional[str]:
        """Download and base64 encode image from URL"""
        try:
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            return base64.b64encode(response.content).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to download/encode image: {e}")
            return None

    def _get_image_hash(self, image_url: str) -> Optional[str]:
        """Generate perceptual hash for duplicate detection"""
        try:
            response = requests.get(image_url, timeout=10)
            img = Image.open(BytesIO(response.content))
            return str(imagehash.phash(img))
        except Exception as e:
            logger.error(f"Failed to hash image: {e}")
            return None

    def _extract_image_metadata(self, image_url: str) -> dict:
        """Extract EXIF and basic metadata from image"""
        metadata = {"has_exif": False, "dimensions": None}
        try:
            response = requests.get(image_url, timeout=10)
            img = Image.open(BytesIO(response.content))
            
            # Get dimensions
            metadata["dimensions"] = img.size
            
            # Check for EXIF data
            exif_data = img._getexif() if hasattr(img, '_getexif') else None
            if exif_data:
                metadata["has_exif"] = True
            
        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
        
        return metadata

    async def _analyze_image_with_vision(self, image_url: str, prompt: str) -> Optional[str]:
        """Call OpenAI Vision API for image analysis"""
        try:
            base64_image = self._encode_image_from_url(image_url)
            if not base64_image: 
                return None

            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]}
                ],
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Vision API Error: {e}")
            return None

    @abstractmethod
    async def process(self, claim_data: dict) -> dict:
        pass