from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os
from datetime import datetime
from dotenv import load_dotenv # <-- ADD THIS LINE
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

@app.get("/")
async def root():
    return {"message": "DecentralizedClaim AI Agents API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/process-claim", response_model=AIAssessmentResult)
async def process_claim(request: ClaimRequest):
    logger.info(f"Received claim processing request for {request.claim_id}")
    result = await claim_workflow.process_claim(request.dict())
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)