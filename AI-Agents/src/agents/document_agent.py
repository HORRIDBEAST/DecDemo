from .base_agent import BaseAgent
import pytesseract
from PIL import Image
import requests
from io import BytesIO
from pdf2image import convert_from_bytes
from datetime import datetime, timedelta
import dateparser
import re
import logging

logger = logging.getLogger(__name__)

class DocumentAgent(BaseAgent):
    def __init__(self):
        super().__init__("document_agent")
        self.system_prompt += " You are an expert insurance document analyst. Accurately classify documents (Home Incident Reports, Police Reports, Medical Bills, Auto Repair Estimates) and validate consistency."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        findings = {
            "text_extracted": [], 
            "validity": "valid",
            "red_flags": [],
            "extracted_dates": [],
            "document_type_matches": True
        }
        
        incident_date_str = claim_data.get("incident_date")
        incident_date = dateparser.parse(incident_date_str) if incident_date_str else None
        claim_type = claim_data.get("claim_type", "").lower()

        # Define type-specific keywords
        type_keywords = {
            "auto": ["vehicle", "car", "driver", "license", "motor", "automobile", "vin", "registration"],
            "health": ["hospital", "medical", "doctor", "diagnosis", "patient", "clinic", "treatment", "prescription"],
            "home": ["property", "residence", "house", "lease", "homeowner", "dwelling", "premises"]
        }

        for url in claim_data.get("document_urls", []):
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                content_type = response.headers.get("Content-Type", "")
                text = ""
                
                # OCR Logic - removed hardcoded Windows path
                if "pdf" in content_type.lower():
                    try:
                        # Assumes poppler is in system PATH (works in Docker/Linux)
                        images = convert_from_bytes(response.content)
                        for img in images:
                            text += pytesseract.image_to_string(img) + "\n"
                    except Exception as e:
                        logger.warning(f"PDF OCR failed: {e}. Install poppler-utils for PDF support.")
                        text = "[PDF OCR Failed - Poppler not available]"
                else:
                    img = Image.open(BytesIO(response.content))
                    text = pytesseract.image_to_string(img)

                findings["text_extracted"].append(text[:500])  # Store snippet
                
                # --- CASE A: Date Validation (Backdating Detection) ---
                if incident_date and len(text) > 20:
                    # Extract all dates from document
                    date_patterns = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text)
                    date_patterns += re.findall(r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b', text)
                    
                    for date_str in date_patterns:
                        parsed_date = dateparser.parse(date_str)
                        if parsed_date:
                            findings["extracted_dates"].append(parsed_date.strftime("%Y-%m-%d"))
                            
                            # Flag if document date is significantly AFTER incident date
                            # (e.g., claim says Jan 1, 2025 but document dated Jan 1, 2024)
                            if parsed_date < incident_date - timedelta(days=30):
                                findings["red_flags"].append(
                                    f"Document contains date {parsed_date.strftime('%Y-%m-%d')} which is >30 days before incident date {incident_date.strftime('%Y-%m-%d')}"
                                )
                                findings["validity"] = "suspicious"
                
                # --- CASE B: Type Mismatch Detection (LLM-Based) ---
                if len(text) > 50:  # Only check if substantial text extracted
                    doc_type = await self._classify_document_type(text)
                    findings["extracted_data"] = findings.get("extracted_data", {})
                    findings["extracted_data"]["detected_type"] = doc_type
                    
                    # Check compatibility using intelligent mapping
                    is_compatible = self._check_type_compatibility(claim_type, doc_type)
                    
                    if not is_compatible and doc_type != "UNKNOWN":
                        # Provide helpful guidance instead of generic warning
                        detected_claim_type = self._map_doc_type_to_claim_type(doc_type)
                        findings["red_flags"].append(
                            f"Document type mismatch: Document appears to be for {detected_claim_type} claim, but claim type is {claim_type}. Please verify claim type selection."
                        )
                        findings["document_type_matches"] = False
                        logger.warning(f"⚠️ Type mismatch: {doc_type} detected but claim type is {claim_type}")
                    elif is_compatible:
                        logger.info(f"✅ Document type ({doc_type}) matches claim type ({claim_type})")
                    else:
                        logger.info(f"Document type unclear ({doc_type}) - giving benefit of doubt")
                
            except Exception as e:
                findings["validity"] = "error"
                findings["red_flags"].append(f"Failed to process document: {str(e)}")

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Lower confidence if red flags found
        confidence = 0.9 if not findings["red_flags"] else 0.5
        
        return self._create_agent_report(confidence, findings, processing_time)
    
    async def _classify_document_type(self, text: str) -> str:
        """Use LLM to classify document type intelligently"""
        try:
            prompt = f"""Analyze this document text and classify it into ONE category.
            
            Context: This is for an insurance claim document.
            
            Text Content (first 1000 chars):
            {text[:1000]}
            
            Categories:
            - AUTO_REPAIR_ESTIMATE (Car parts, garage, VIN, vehicle registration)
            - HOME_INCIDENT_REPORT (HOA, Resident Association, Property damage, Address, Window/Roof/Leak/Breakage)
            - MEDICAL_BILL (Hospital, Doctor, Diagnosis, Patient)
            - POLICE_REPORT (Police, Officer, Case number)
            - INVOICE_RECEIPT (Generic invoice, receipt)
            - UNKNOWN (Cannot determine)
            
            Return ONLY the category name (e.g., HOME_INCIDENT_REPORT)."""
            
            response = await self.llm.ainvoke(prompt)
            classification = response.content.strip()
            logger.info(f"Document classified as: {classification}")
            return classification
        except Exception as e:
            logger.error(f"Document classification failed: {e}")
            return "UNKNOWN"
    
    def _check_type_compatibility(self, claim_type: str, doc_type: str) -> bool:
        """Check if document type is compatible with claim type"""
        if doc_type == "UNKNOWN":
            return True  # Give benefit of doubt
        
        # Define compatible mappings
        compatibility_map = {
            "auto": ["AUTO_REPAIR_ESTIMATE", "POLICE_REPORT", "INVOICE_RECEIPT"],
            "home": ["HOME_INCIDENT_REPORT", "INVOICE_RECEIPT", "POLICE_REPORT"],
            "health": ["MEDICAL_BILL", "INVOICE_RECEIPT", "POLICE_REPORT"]
        }
        
        compatible_types = compatibility_map.get(claim_type.lower(), [])
        return doc_type in compatible_types
    
    def _map_doc_type_to_claim_type(self, doc_type: str) -> str:
        """Map document type to user-friendly claim type name"""
        mapping = {
            "MEDICAL_BILL": "health/medical",
            "AUTO_REPAIR_ESTIMATE": "auto/vehicle",
            "HOME_INCIDENT_REPORT": "home/property",
            "POLICE_REPORT": "police report (can be auto/home/health)",
            "INVOICE_RECEIPT": "general invoice/receipt",
            "UNKNOWN": "unknown"
        }
        return mapping.get(doc_type, doc_type.lower())