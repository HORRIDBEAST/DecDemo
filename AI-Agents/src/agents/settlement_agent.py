from .base_agent import BaseAgent
from datetime import datetime 
class SettlementAgent(BaseAgent):
    def __init__(self):
        super().__init__("settlement_agent")
        self.system_prompt += " Calculate recommended settlement amount."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        doc_report = claim_data.get("agent_reports", {}).get("document_agent", {})
        damage_report = claim_data.get("agent_reports", {}).get("damage_agent", {})
        requested = claim_data.get("requested_amount", 0)
        findings = {
            "recommended_amount": min(requested, damage_report.get("findings", {}).get("estimated_cost", requested) * 0.9)
        }

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        return self._create_agent_report(0.9, findings, processing_time)