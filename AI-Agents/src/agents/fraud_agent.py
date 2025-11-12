from .base_agent import BaseAgent
from datetime import datetime 
class FraudAgent(BaseAgent):
    def __init__(self):
        super().__init__("fraud_agent")
        self.system_prompt += " Detect potential fraud in claim data."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        fraud_risk = claim_data.get("requested_amount", 0) > 5000
        findings = {
            "fraud_detected": fraud_risk,
            "risk_score": 30 if fraud_risk else 10,
            "reason": "High amount flagged" if fraud_risk else "No fraud detected"
        }

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        return self._create_agent_report(0.95 if not fraud_risk else 0.6, findings, processing_time)