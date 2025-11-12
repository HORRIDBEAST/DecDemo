from .base_agent import BaseAgent
from datetime import datetime 
class DamageAgent(BaseAgent):
    def __init__(self):
        super().__init__("damage_agent")
        self.system_prompt += " Assess damage from photos using mock vision analysis."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        findings = {"damage_level": "moderate", "estimated_cost": claim_data.get("requested_amount", 0) * 0.7}

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        return self._create_agent_report(0.85, findings, processing_time)