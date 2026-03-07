# src/agents/fraud_agent.py
from .base_agent import BaseAgent
from datetime import datetime, timedelta
import json
import logging
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from src.tools.weather_tool import verify_historical_weather
from src.tools.price_tool import verify_market_price

logger = logging.getLogger(__name__)

class FraudAgent(BaseAgent):
    def __init__(self):
        super().__init__("fraud_agent")
        
        # ✅ Bind MCP Tools (Weather & Price)
        self.llm_with_tools = self.llm.bind_tools([verify_historical_weather, verify_market_price])
        
        self.system_prompt = """
        You are an elite Insurance Fraud Detection Agent with access to real-world data tools.
        
        YOUR TOOLKIT:
        1. verify_historical_weather: Check actual weather conditions on claim date
        2. verify_market_price: Search current market rates for repairs/services
        
        ANALYSIS APPROACH:
        - Use tools when claim mentions weather or specific repairs/services
        - Look for inconsistencies between claim description and real data
        - PRICE LOGIC (CRITICAL):
          * If claimed amount < market minimum → LEGITIMATE (user is honest, not inflating)
          * If claimed amount is within market range → LEGITIMATE
          * If claimed amount > market maximum × 2 → SUSPICIOUS (price inflation fraud)
        - Flag suspicious patterns but remain objective
        
        OUTPUT FORMAT (STRICT JSON):
        {
            "fraud_detected": boolean,
            "risk_score": integer (0-100),
            "reason": "clear explanation with evidence",
            "red_flags": ["specific", "concerns", "found"],
            "tool_findings": "summary of tool results"
        }
        """

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        findings = {
            "red_flags": [], 
            "risk_score": 0,
            "fraud_detected": False,
            "reason": "",
            "tool_findings": ""
        }
        
        # --- WEIGHTED RISK SCORING SYSTEM ---
        # Instead of simple thresholds, we accumulate risk points
        
        # 1. HISTORICAL PATTERN ANALYSIS (Supabase)
        user_id = claim_data.get("user_id")
        if self.supabase and user_id:
            try:
                # Check claim frequency in last 365 days
                one_year_ago = (datetime.utcnow() - timedelta(days=365)).isoformat()
                
                response = self.supabase.table("claims")\
                    .select("id", count="exact")\
                    .eq("user_id", user_id)\
                    .gte("created_at", one_year_ago)\
                    .execute()
                
                claim_count = response.count if hasattr(response, 'count') else 0
                
                if claim_count > 5:
                    findings["risk_score"] += 40
                    findings["red_flags"].append(f"Frequent claimer: {claim_count} claims in last year")
                elif claim_count > 3:
                    findings["risk_score"] += 20
                    findings["red_flags"].append(f"Multiple claims: {claim_count} in last year")
                    
            except Exception as e:
                logger.error(f"Supabase history check failed: {e}")

        # 2. AGENT REPORT ANALYSIS
        # Check findings from other agents
        damage_report = claim_data.get("agent_reports", {}).get("damage_agent", {})
        doc_report = claim_data.get("agent_reports", {}).get("document_agent", {})
        
        # Damage agent red flags
        damage_flags = damage_report.get("findings", {}).get("red_flags", [])
        if damage_flags:
            findings["risk_score"] += len(damage_flags) * 10
            findings["red_flags"].extend(damage_flags)
        
        # Document agent red flags
        doc_flags = doc_report.get("findings", {}).get("red_flags", [])
        if doc_flags:
            findings["risk_score"] += len(doc_flags) * 15  # Higher weight for document issues
            findings["red_flags"].extend(doc_flags)
        
        # Invalid evidence detection
        if not damage_report.get("findings", {}).get("damage_detected", True):
            findings["risk_score"] += 35
            findings["red_flags"].append("Damage photos do not show valid evidence")
        
        # Document type mismatch
        if not doc_report.get("findings", {}).get("document_type_matches", True):
            findings["risk_score"] += 50  # Critical red flag
            findings["red_flags"].append("Document type does not match claim type")
        
        # 3. MCP TOOL-ASSISTED ANALYSIS (Weather/Price Verification)
        desc = claim_data.get("description", "")
        date = claim_data.get("incident_date", "").split("T")[0] if claim_data.get("incident_date") else ""
        loc = claim_data.get("location", "Unknown")
        amount = claim_data.get("requested_amount", 0)
        
        user_content = f"""
        Analyze this insurance claim for fraud indicators:
        - Amount Requested: ${amount:,.2f}
        - Incident Date: {date}
        - Location: {loc}
        - Description: {desc}
        
        Use your tools to verify facts and identify inconsistencies.
        """

        messages = [SystemMessage(content=self.system_prompt), HumanMessage(content=user_content)]
        
        # Invoke LLM with Tools
        try:
            ai_msg = await self.llm_with_tools.ainvoke(messages)
            messages.append(ai_msg)
            
            tool_summaries = []
            weather_contradiction_detected = False
            price_inflation_detected = False
            
            if ai_msg.tool_calls:
                logger.info(f"FraudAgent invoking {len(ai_msg.tool_calls)} tool(s)")
                
                for tool_call in ai_msg.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    
                    tool_output = "Error executing tool"
                    
                    if tool_name == "verify_historical_weather":
                        logger.info(f"Checking weather: {tool_args}")
                        tool_output = await verify_historical_weather.ainvoke(tool_args)
                        logger.info(f"Weather result: {tool_output[:100]}...")
                        
                        # ✅ FIX 4: Graceful Fallback for Weather Tool
                        tool_output_lower = str(tool_output).lower()
                        
                        # Check if tool failed or returned no data
                        if "no weather data found" in tool_output_lower or "failed" in tool_output_lower or "error" in tool_output_lower:
                            logger.info("⚠️ Weather tool failed or no data available - Skipping weather validation (no penalty)")
                            tool_summaries.append("Weather Verification: Skipped (Data unavailable)")
                            # DO NOT add to red_flags or risk_score
                        else:
                            # ✅ EXPLICIT WEATHER CONTRADICTION CHECK (Only if valid data)
                            desc_lower = desc.lower()
                            
                            # User claims weather event but data shows clear/dry
                            if any(keyword in desc_lower for keyword in ["flood", "storm", "rain", "hail", "snow", "hurricane"]):
                                if ("precipitation: 0.0" in tool_output_lower or 
                                    "clear sky" in tool_output_lower or 
                                    "clear/cloudy" in tool_output_lower):
                                    weather_contradiction_detected = True
                                    findings["risk_score"] += 45  # CRITICAL FRAUD INDICATOR
                                    findings["red_flags"].append(f"CRITICAL: Claim mentions weather event but data shows clear conditions")
                                    logger.warning(f"⚠️ Weather contradiction detected!")
                            
                            tool_summaries.append(f"Weather Verification: {tool_output[:80]}...")
                        
                    elif tool_name == "verify_market_price":
                        if "vehicle_info" not in tool_args:
                            tool_args["vehicle_info"] = "Vehicle"
                        logger.info(f"Checking market price: {tool_args}")
                        tool_output = verify_market_price.invoke(tool_args)
                        logger.info(f"Price result: {tool_output[:100]}...")
                        
                        # ✅ EXPLICIT PRICE INFLATION CHECK
                        # Extract price range from tool output and compare with claimed amount
                        tool_output_str = str(tool_output).lower()
                        claimed_amount = claim_data.get("requested_amount", 0)
                        
                        # Try to extract numerical prices from search results
                        # Common patterns: ₹2,500-8,500 or $500-1500 or Rs 2500 to 8500
                        import re
                        price_patterns = [
                            r'₹\s*([\d,]+)\s*(?:to|-)\s*₹?\s*([\d,]+)',  # ₹2,500-₹8,500
                            r'\$\s*([\d,]+)\s*(?:to|-)\s*\$?\s*([\d,]+)',  # $500-$1500
                            r'rs\.?\s*([\d,]+)\s*(?:to|-)\s*(?:rs\.?)?\s*([\d,]+)',  # Rs 2500-8500
                            r'([\d,]+)\s*(?:to|-)\s*([\d,]+)',  # Generic 2500-8500
                        ]
                        
                        prices_found = []
                        for pattern in price_patterns:
                            matches = re.findall(pattern, tool_output_str, re.IGNORECASE)
                            if matches:
                                for match in matches:
                                    try:
                                        min_price = float(match[0].replace(',', ''))
                                        max_price = float(match[1].replace(',', ''))
                                        prices_found.append((min_price, max_price))
                                    except ValueError:
                                        continue
                        
                        # If we found price ranges, check for inflation (NOT deflation)
                        if prices_found and claimed_amount > 0:
                            # Use the widest range found (most generous)
                            market_min = min(p[0] for p in prices_found)
                            market_max = max(p[1] for p in prices_found)
                            
                            # CRITICAL LOGIC: Only flag if claimed > market_max * 2
                            # Do NOT flag if claimed < market_min (that's honest!)
                            if claimed_amount > (market_max * 2.0):
                                price_inflation_detected = True
                                inflation_ratio = claimed_amount / market_max
                                findings["risk_score"] += 40
                                findings["red_flags"].append(
                                    f"CRITICAL: Price inflation detected - claimed ${claimed_amount:,.0f} "
                                    f"vs market ${market_min:,.0f}-${market_max:,.0f} "
                                    f"({inflation_ratio:.1f}x market maximum)"
                                )
                                logger.warning(f"⚠️ Price inflation: ${claimed_amount} >> ${market_max}")
                            elif claimed_amount < market_min:
                                # User is claiming LESS than market - that's GOOD (honest)
                                logger.info(f"✅ Claim amount ${claimed_amount} below market minimum ${market_min} - legitimate")
                            else:
                                # Within market range - normal
                                logger.info(f"✅ Claim amount ${claimed_amount} within market range ${market_min}-${market_max}")
                    
                    tool_summaries.append(f"{tool_name}: {str(tool_output)[:150]}")
                    messages.append(ToolMessage(content=str(tool_output), tool_call_id=tool_call["id"]))
                
                # Final AI analysis incorporating tool results
                final_response = await self.llm.ainvoke(messages)
                content = final_response.content
            else:
                content = ai_msg.content
            
            # Parse AI findings
            try:
                clean_json = content.replace("```json", "").replace("```", "").strip()
                ai_findings = json.loads(clean_json)
                
                # Merge AI risk score (weighted at 60% of total)
                ai_risk = ai_findings.get("risk_score", 0)
                findings["risk_score"] += int(ai_risk * 0.6)
                
                # Merge AI red flags
                ai_flags = ai_findings.get("red_flags", [])
                findings["red_flags"].extend(ai_flags)
                
                # Tool findings summary
                findings["tool_findings"] = "; ".join(tool_summaries) if tool_summaries else "No tools used"
                
                # Reason from AI
                findings["reason"] = ai_findings.get("reason", "Analysis complete")
                
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse AI response: {e}")
                findings["risk_score"] += 20
                findings["reason"] = "AI analysis inconclusive - flagged for review"
        
        except Exception as e:
            logger.error(f"Error in FraudAgent processing: {e}")
            findings["risk_score"] += 30
            findings["reason"] = f"Processing error: {str(e)}"
        
        # 4. FINAL SCORING & DETERMINATION
        # Cap risk score at 100
        findings["risk_score"] = min(100, findings["risk_score"])
        
        # Fraud threshold: >70 = High Risk
        findings["fraud_detected"] = findings["risk_score"] > 70
        
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Lower confidence for high-risk cases (ensures human review)
        confidence = 0.95 if findings["risk_score"] < 30 else 0.85 if findings["risk_score"] < 70 else 0.70
        
        logger.info(f"Fraud analysis complete: Risk={findings['risk_score']}, Flags={len(findings['red_flags'])}")
        
        return self._create_agent_report(confidence, findings, processing_time)
