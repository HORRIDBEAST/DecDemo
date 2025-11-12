from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ClaimRequest(BaseModel):
    claim_id: str
    claim_type: str  # "AUTO", "HOME", "HEALTH"
    requested_amount: float
    description: str
    document_urls: List[str] = []
    damage_photo_urls: List[str] = []
    incident_date: Optional[str] = None
    location: Optional[str] = None

class AgentReport(BaseModel):
    confidence: float  # 0-1
    findings: dict
    processing_time: float  # seconds

class AIAssessmentResult(BaseModel):
    claim_id: str
    confidence_score: float  # 0-100
    risk_score: float  # 0-100
    recommended_amount: float
    fraud_detected: bool
    fraud_reason: Optional[str] = None
    requires_human_review: bool
    agent_reports: dict  # {agent_name: AgentReport}
    processing_time: float  # seconds
    metadata: dict = {}