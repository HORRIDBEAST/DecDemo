from abc import ABC, abstractmethod
from langchain_openai import ChatOpenAI
from langsmith import traceable
import logging
from datetime import datetime
import os
logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    def __init__(self, name: str, model_provider: str = "openai"):
        self.name = name
        self.llm = ChatOpenAI(model="gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"))
        self.system_prompt = f"You are a {name} agent for insurance claim processing."
        logger.info(f"{name} agent initialized with {model_provider}")

    @traceable
    async def health_check(self):
        return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

    def _create_agent_report(self, confidence: float, findings: dict, processing_time: float) -> dict:
        return {"confidence": confidence, "findings": findings, "processing_time": processing_time}

    @abstractmethod
    async def process(self, claim_data: dict) -> dict:
        pass