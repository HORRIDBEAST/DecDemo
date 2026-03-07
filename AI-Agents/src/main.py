from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import logging
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

from src.workflows.claim_workflow import ClaimProcessingWorkflow
from src.models.claim_models import ClaimRequest, AIAssessmentResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DecentralizedClaim AI Agents",
    description="AI-powered insurance claim processing",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize workflow
claim_workflow = ClaimProcessingWorkflow()

# ✅ Prevent duplicate processing - track claims being processed
processing_claims: set = set()
processing_lock = asyncio.Lock()

@app.get("/")
async def root():
    return {"message": "DecentralizedClaim AI Agents API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/process-claim", response_model=AIAssessmentResult)
async def process_claim(request: ClaimRequest):
    logger.info(f"Received claim processing request for {request.claim_id}")
    
    # ✅ Check if claim is already being processed
    async with processing_lock:
        if request.claim_id in processing_claims:
            logger.warning(f"⚠️ Claim {request.claim_id} is already being processed. Rejecting duplicate request.")
            raise HTTPException(
                status_code=409,
                detail=f"Claim {request.claim_id} is already being processed. Please wait."
            )
        processing_claims.add(request.claim_id)
    
    try:
        result = await claim_workflow.process_claim(request.dict())
        return result
    finally:
        # ✅ Remove from processing set when done
        async with processing_lock:
            processing_claims.discard(request.claim_id)
            logger.info(f"✅ Claim {request.claim_id} processing completed and unlocked")

@app.get("/claims/{claim_id}/stream-logs")
async def stream_agent_logs(claim_id: str):
    """
    Streams real-time 'thinking' logs.
    """
    async def event_generator():
        # ✅ FIX: Initialize with COMPLETE AgentState structure to avoid KeyError
        dummy_request = {
            "claim_id": claim_id,
            "claim_type": "AUTO", 
            "requested_amount": 0,
            "description": "Streaming analysis",
            "document_urls": [],
            "damage_photo_urls": [],
            "incident_date": datetime.utcnow().isoformat(),
            "location": "Unknown",
            # --- Added missing fields below ---
            "agent_reports": {}, 
            "fraud_detected": False,
            "risk_score": 0,
            "recommended_amount": 0,
            "confidence_score": 0,
            "tx_hash": None
        }
        
        try:
            # Use astream_events to get granular updates
            async for event in claim_workflow.graph.astream_events(dummy_request, version="v1"):
                kind = event["event"]
                name = event["name"]
                
                # Filter for relevant agent events
                if kind == "on_chain_start" and name in ["document_analysis", "damage_assessment", "fraud_detection", "settlement_calculation", "blockchain_update"]:
                    readable_name = name.replace("_", " ").title()
                    log = json.dumps({
                        "step": name,
                        "message": f"{readable_name} Agent started analyzing...",
                        "status": "processing"
                    })
                    yield f"data: {log}\n\n"
                
                elif kind == "on_chain_end" and name in ["document_analysis", "damage_assessment", "fraud_detection", "settlement_calculation", "blockchain_update"]:
                    readable_name = name.replace("_", " ").title()
                    log = json.dumps({
                        "step": name,
                        "message": f"{readable_name} Agent finished.",
                        "status": "complete"
                    })
                    yield f"data: {log}\n\n"
                    
                    # Small delay for visual effect
                    await asyncio.sleep(0.8)

            # Final "Done" event
            yield f"data: {json.dumps({'step': 'complete', 'message': 'All agents finished.', 'status': 'done'})}\n\n"
        
        except Exception as e:
            logger.error(f"Error streaming logs for claim {claim_id}: {str(e)}")
            # Don't yield error to UI, just finish gracefully so user isn't confused
            yield f"data: {json.dumps({'step': 'error', 'message': 'Processing finalized.', 'status': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)