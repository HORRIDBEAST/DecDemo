from .base_agent import BaseAgent
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class DamageAgent(BaseAgent):
    def __init__(self):
        super().__init__("damage_agent")
        self.system_prompt += " Assess damage from photos using AI vision analysis."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        findings = {
            "damage_detected": False,
            "severity": "unknown",
            "estimated_cost": 0,
            "red_flags": [],
            "damage_description": "",
            "image_analysis_performed": False
        }
        
        photo_urls = claim_data.get("damage_photo_urls", [])
        claim_type = claim_data.get("claim_type", "auto").lower()
        req_amount = claim_data.get("requested_amount", 0)

        if not photo_urls:
            findings["red_flags"].append("No damage photos provided")
            findings["severity"] = "unverified"
            # Fallback to simple estimate
            findings["estimated_cost"] = req_amount * 0.7
            return self._create_agent_report(0.2, findings, (datetime.utcnow() - start_time).total_seconds())

        # Analyze first photo (in production, loop through all photos)
        main_photo = photo_urls[0]
        
        # 1. Check Image Metadata & Hash (Relaxed)
        metadata = self._extract_image_metadata(main_photo)
        if not metadata.get("has_exif"):
            # ✅ FIX: Missing EXIF is common for web uploads, social media images
            # Don't auto-flag as fraud, just note it
            logger.info("Photo lacks EXIF data - typical for digital/web images")
            findings["metadata_note"] = "Digital image (no EXIF) - common for web uploads"
        
        img_hash = self._get_image_hash(main_photo)
        if img_hash:
            # In production, check against database of known fraud images
            findings["image_hash"] = img_hash

        # 2. AI Vision Analysis (Context-Aware)
        user_description = claim_data.get("description", "")
        vision_prompt = f"""
        Analyze this image for a {claim_type.upper()} insurance claim.
        
        User Description: "{user_description}"
        
        Task:
        1. Verify if the image shows damage consistent with the description.
        2. Estimate repair cost considering materials mentioned (e.g., 'tempered glass', 'marble', 'electronics' cost more).
        
        Return ONLY valid JSON with these exact fields:
        {{
            "valid_evidence": true/false (is this actually showing {claim_type} damage matching the description?),
            "severity": "none/minor/moderate/severe/total_loss",
            "description": "brief description of what you see",
            "estimate_min": number (minimum USD repair cost estimate),
            "estimate_max": number (maximum USD repair cost estimate),
            "confidence": number (0-100, how confident are you in this assessment)
        }}
        
        CRITICAL: If this image does NOT show {claim_type} damage (e.g., wrong type of property), set valid_evidence to false.
        """
        
        vision_response = await self._analyze_image_with_vision(main_photo, vision_prompt)
        
        if vision_response:
            try:
                # Parse vision AI response
                clean_response = vision_response.replace("```json", "").replace("```", "").strip()
                vision_data = json.loads(clean_response)
                
                findings["image_analysis_performed"] = True
                findings["damage_detected"] = vision_data.get("valid_evidence", False)
                findings["severity"] = vision_data.get("severity", "unknown")
                findings["damage_description"] = vision_data.get("description", "")
                
                # Calculate estimated cost from AI
                est_min = vision_data.get("estimate_min", 0)
                est_max = vision_data.get("estimate_max", 0)
                avg_estimate = (est_min + est_max) / 2 if est_max > 0 else est_min
                findings["estimated_cost"] = avg_estimate
                findings["estimate_range"] = f"${est_min:,.0f} - ${est_max:,.0f}"
                
                # CASE B: Photo Type Mismatch
                if not findings["damage_detected"]:
                    # Provide helpful guidance about what was actually detected
                    detected_content = findings['damage_description'].lower()
                    suggested_type = self._suggest_claim_type(detected_content)
                    
                    findings["red_flags"].append(
                        f"Photo type mismatch: Image shows {findings['damage_description']}, not {claim_type} damage. {suggested_type}"
                    )
                
                # Price Inflation Check (ONLY flag if claimed > 2.5x estimate)
                # Do NOT flag if claimed < estimate (that's honest/conservative)
                if avg_estimate > 0 and req_amount > (avg_estimate * 2.5):
                    findings["red_flags"].append(
                        f"Requested amount ${req_amount:,.0f} is {req_amount/avg_estimate:.1f}x higher than AI estimate ${avg_estimate:,.0f}"
                    )
                    logger.warning(f"⚠️ Price inflation: ${req_amount} >> ${avg_estimate} AI estimate")
                elif avg_estimate > 0 and req_amount < avg_estimate:
                    # User claiming LESS than AI estimate - this is good (conservative claim)
                    logger.info(f"✅ Conservative claim: ${req_amount} < ${avg_estimate} AI estimate - legitimate")
                
                # Store AI confidence
                findings["ai_confidence"] = vision_data.get("confidence", 50)
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Vision API response: {e}")
                findings["red_flags"].append("AI vision analysis failed to parse")
                # Fallback to simple estimate
                findings["estimated_cost"] = req_amount * 0.7
        else:
            # Vision API failed, use fallback logic
            findings["red_flags"].append("AI vision analysis unavailable")
            findings["estimated_cost"] = req_amount * 0.7
            findings["severity"] = "unverified"

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Calculate confidence based on whether vision worked and red flags
        confidence = 0.85
        if findings["image_analysis_performed"] and findings.get("ai_confidence", 0) > 70:
            confidence = 0.95
        elif findings["red_flags"]:
            confidence = 0.5
        
        return self._create_agent_report(confidence, findings, processing_time)    
    def _suggest_claim_type(self, description: str) -> str:
        """Suggest correct claim type based on detected content"""
        desc_lower = description.lower()
        
        if any(word in desc_lower for word in ["hospital", "medical", "patient", "doctor", "surgery", "treatment"]):
            return "Consider filing as a health/medical claim instead."
        elif any(word in desc_lower for word in ["car", "vehicle", "bumper", "windshield", "tire"]):
            return "Consider filing as an auto/vehicle claim instead."
        elif any(word in desc_lower for word in ["house", "window", "roof", "wall", "door", "property"]):
            return "Consider filing as a home/property claim instead."
        else:
            return "Please verify the claim type selection."