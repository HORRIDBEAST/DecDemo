import asyncio
from typing import Dict, Any, List, Callable, Awaitable, Optional
from datetime import datetime
import logging

# CHANGE 1: Import StateGraph and define the state schema
from langgraph.graph import StateGraph
from typing import TypedDict, List

from langsmith import traceable
from ..agents.document_agent import DocumentAgent
from ..agents.damage_agent import DamageAgent
from ..agents.fraud_agent import FraudAgent
from ..agents.settlement_agent import SettlementAgent
from ..agents.blockchain_agent import BlockchainAgent
from ..models.claim_models import AIAssessmentResult, AgentReport

logger = logging.getLogger(__name__)


# This TypedDict defines the structure of our application's state.
# All nodes in the graph will read from and write to this state.
class AgentState(TypedDict):
    claim_id: str
    user_id: str  # Added for Supabase historical checks
    claim_type: str
    requested_amount: float
    description: str
    document_urls: List[str]
    damage_photo_urls: List[str]
    incident_date: str
    location: str
    agent_reports: Dict[str, Any]
    fraud_detected: bool
    risk_score: int
    recommended_amount: float
    confidence_score: float
    tx_hash: str
    assessment_status: str
    progress_callback: Optional[Callable[[str, str, str], Awaitable[None]]]


class ClaimProcessingWorkflow:
    def __init__(self):
        self.document_agent = DocumentAgent()
        self.damage_agent = DamageAgent()
        self.fraud_agent = FraudAgent()
        self.settlement_agent = SettlementAgent()
        self.blockchain_agent = BlockchainAgent()
        self.graph = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        # CHANGE 2: Initialize StateGraph with our new AgentState schema
        workflow = StateGraph(AgentState)

        workflow.add_node("document_analysis", self._document_analysis_node)
        workflow.add_node("damage_assessment", self._damage_assessment_node)
        workflow.add_node("fraud_detection", self._fraud_detection_node)
        workflow.add_node("settlement_calculation", self._settlement_calculation_node)
        workflow.add_node("blockchain_update", self._blockchain_update_node)

        workflow.add_edge("document_analysis", "damage_assessment")
        workflow.add_edge("damage_assessment", "fraud_detection")
        workflow.add_edge("fraud_detection", "settlement_calculation")
        workflow.add_edge("settlement_calculation", "blockchain_update")

        workflow.set_entry_point("document_analysis")
        # The 'END' node is implicitly the last node in a linear chain
        workflow.add_edge("blockchain_update", "__end__")
        
        return workflow.compile()

    async def _document_analysis_node(self, state: AgentState) -> AgentState:
        await self._emit(state, "document_analysis", "processing", "Document Analysis Agent started analyzing...")
        logger.info(f"Processing document analysis for claim {state['claim_id']}")
        report = await self.document_agent.process(state)
        state['agent_reports']['document_agent'] = report
        await self._emit(state, "document_analysis", "complete", "Document Analysis Agent finished.")
        return state

    async def _damage_assessment_node(self, state: AgentState) -> AgentState:
        await self._emit(state, "damage_assessment", "processing", "Damage Assessment Agent started analyzing...")
        logger.info(f"Processing damage assessment for claim {state['claim_id']}")
        report = await self.damage_agent.process(state)
        state['agent_reports']['damage_agent'] = report
        await self._emit(state, "damage_assessment", "complete", "Damage Assessment Agent finished.")
        return state

    async def _fraud_detection_node(self, state: AgentState) -> AgentState:
        await self._emit(state, "fraud_detection", "processing", "Fraud Detection Agent started analyzing...")
        logger.info(f"Processing fraud detection for claim {state['claim_id']}")
        report = await self.fraud_agent.process(state)
        state['agent_reports']['fraud_agent'] = report
        state['fraud_detected'] = report['findings'].get('fraud_detected', False)
        state['risk_score'] = report['findings'].get('risk_score', 0)
        await self._emit(state, "fraud_detection", "complete", "Fraud Detection Agent finished.")
        return state

    async def _settlement_calculation_node(self, state: AgentState) -> AgentState:
        await self._emit(state, "settlement_calculation", "processing", "Settlement Calculation Agent started analyzing...")
        logger.info(f"Processing settlement for claim {state['claim_id']}")
        report = await self.settlement_agent.process(state)
        state['agent_reports']['settlement_agent'] = report
        state['recommended_amount'] = report['findings'].get('recommended_amount', 0)
        self._determine_outcome(state)
        await self._emit(state, "settlement_calculation", "complete", "Settlement Calculation Agent finished.")
        return state

    async def _blockchain_update_node(self, state: AgentState) -> AgentState:
        await self._emit(state, "blockchain_update", "processing", "Blockchain Update Agent started analyzing...")
        logger.info(f"Updating blockchain for claim {state['claim_id']}")
        report = await self.blockchain_agent.process(state)
        state['agent_reports']['blockchain_agent'] = report
        state['tx_hash'] = report['findings'].get('tx_hash')
        await self._emit(state, "blockchain_update", "complete", "Blockchain Update Agent finished.")
        return state

    async def _emit(self, state: AgentState, step: str, status: str, message: str) -> None:
        callback = state.get("progress_callback")
        if callback:
            await callback(step, status, message)

    def _determine_outcome(self, state: AgentState) -> None:
        """Derive a consistent final disposition from deterministic evidence."""
        reports = state["agent_reports"]
        fraud_findings = reports.get("fraud_agent", {}).get("findings", {})
        document_findings = reports.get("document_agent", {}).get("findings", {})
        risk_score = int(state.get("risk_score", 0))
        ratio = fraud_findings.get("amount_discrepancy_ratio") or 0
        document_mismatch = bool(document_findings.get("doc_amount_mismatch"))
        weather_mismatch = bool(fraud_findings.get("weather_mismatch"))

        confidences = [report["confidence"] for report in reports.values() if report and "confidence" in report]
        evidence_confidence = sum(confidences) / len(confidences) if confidences else 0
        if weather_mismatch:
            evidence_confidence -= 0.20
        if document_mismatch:
            evidence_confidence -= 0.20
        if ratio > 5.0:
            evidence_confidence -= 0.30
        state["confidence_score"] = max(0.0, min(1.0, evidence_confidence))

        if risk_score >= 75 or fraud_findings.get("forced_fraud", False):
            state["fraud_detected"] = True
            state["assessment_status"] = "REJECTED_FRAUD"
            state["recommended_amount"] = 0
        elif risk_score >= 40 or document_mismatch or ratio > 2.0 or state["confidence_score"] < 0.80:
            state["fraud_detected"] = False
            state["assessment_status"] = "REQUIRES_HUMAN_REVIEW"
        else:
            state["fraud_detected"] = False
            state["assessment_status"] = "PRE_APPROVED"

    @traceable
    async def process_claim(self, request: dict, progress_callback=None) -> AIAssessmentResult:
        start_time = datetime.utcnow()
        # Initialize the state dictionary with all keys from AgentState
        initial_state: AgentState = {
            "claim_id": request["claim_id"],
            "user_id": request.get("user_id"),
            "claim_type": request["claim_type"],
            "requested_amount": request["requested_amount"],
            "description": request["description"],
            "document_urls": request.get("document_urls", []),
            "damage_photo_urls": request.get("damage_photo_urls", []),
            "incident_date": request.get("incident_date"),
            "location": request.get("location"),
            "agent_reports": {},
            "fraud_detected": False,
            "risk_score": 0,
            "recommended_amount": 0,
            "confidence_score": 0,
            "tx_hash": None,
            "assessment_status": "PROCESSING",
            "progress_callback": progress_callback,
        }

        try:
            # The .ainvoke method now takes the initial state directly
            final_state = await self.graph.ainvoke(initial_state)
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            requires_human_review = final_state.get("assessment_status") == "REQUIRES_HUMAN_REVIEW"
            
            # If fraud detected, set recommended amount to $0 to avoid confusion
            recommended_amount = final_state.get("recommended_amount", 0)
            if final_state.get("fraud_detected", False):
                recommended_amount = 0
            
            # ✅ Extract fraud reason from fraud agent report
            fraud_report = final_state.get("agent_reports", {}).get("fraud_agent", {})
            fraud_findings = fraud_report.get("findings", {})
            fraud_reason = None
            
            if final_state.get("fraud_detected", False):
                # Get main reason with evidence
                fraud_reason = fraud_findings.get("reason", "Flagged by AI for inconsistencies")
                
                # Append key red flags for transparency
                red_flags = fraud_findings.get("red_flags", [])
                if red_flags:
                    top_flags = red_flags[:2]  # Show top 2 flags
                    fraud_reason += ". Key issues: " + "; ".join(top_flags)

            return AIAssessmentResult(
                claim_id=final_state["claim_id"],
                confidence_score=final_state.get("confidence_score", 0) * 100,
                risk_score=final_state.get("risk_score", 0),
                recommended_amount=recommended_amount,
                fraud_detected=final_state.get("fraud_detected", False),
                fraud_reason=fraud_reason,
                assessment_status=final_state.get("assessment_status", "REQUIRES_HUMAN_REVIEW"),
                requires_human_review=requires_human_review,
                agent_reports=final_state.get("agent_reports", {}),
                processing_time=processing_time,
                metadata={"tx_hash": final_state.get("tx_hash")}
            )
        except Exception as e:
            logger.error(f"Workflow failed for claim {request['claim_id']}: {str(e)}")
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            return AIAssessmentResult(
                claim_id=request["claim_id"],
                confidence_score=0,
                risk_score=100,
                recommended_amount=0,
                fraud_detected=False,
                fraud_reason=f"Processing error: {str(e)}",
                assessment_status="REQUIRES_HUMAN_REVIEW",
                requires_human_review=True,
                agent_reports={},
                processing_time=processing_time,
                metadata={"error": str(e)}
            )
