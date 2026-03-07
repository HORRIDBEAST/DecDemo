from .base_agent import BaseAgent
from datetime import datetime 

class SettlementAgent(BaseAgent):
    def __init__(self):
        super().__init__("settlement_agent")
        self.system_prompt += " Calculate recommended settlement amount based on policy limits, damage assessment, and fraud indicators."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        
        # --- CRITICAL: Fraud Override ---
        fraud_detected = claim_data.get("fraud_detected", False)
        if fraud_detected:
            findings = {
                "recommended_amount": 0,
                "reason": "Claim flagged as fraudulent - no payout authorized",
                "requires_review": True
            }
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            return self._create_agent_report(0.95, findings, processing_time)
        
        # --- Normal Settlement Calculation ---
        doc_report = claim_data.get("agent_reports", {}).get("document_agent", {})
        damage_report = claim_data.get("agent_reports", {}).get("damage_agent", {})
        fraud_report = claim_data.get("agent_reports", {}).get("fraud_agent", {})
        
        requested = claim_data.get("requested_amount", 0)
        estimated_cost = damage_report.get("findings", {}).get("estimated_cost", requested)
        risk_score = fraud_report.get("findings", {}).get("risk_score", 0)
        
        # Base payout: 90% of estimated cost (10% deductible)
        base_payout = min(requested, estimated_cost) * 0.9
        
        # Risk-based adjustment
        if risk_score > 50:
            # High-risk claims get reduced payout + mandatory review
            payout = base_payout * 0.7  # 30% reduction for high-risk
            requires_review = True
            reason = f"High-risk claim (score: {risk_score}) - reduced payout + human review required"
        elif risk_score > 30:
            # Medium-risk claims get slight reduction
            payout = base_payout * 0.85
            requires_review = True
            reason = f"Medium-risk claim (score: {risk_score}) - flagged for review"
        else:
            # Low-risk claims get full payout
            payout = base_payout
            requires_review = False
            reason = f"Low-risk claim (score: {risk_score}) - approved for payout"
        
        findings = {
            "recommended_amount": round(payout, 2),
            "reason": reason,
            "requires_review": requires_review,
            "risk_score": risk_score
        }

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        confidence = 0.95 if risk_score < 30 else 0.85 if risk_score < 50 else 0.70
        
        return self._create_agent_report(confidence, findings, processing_time)