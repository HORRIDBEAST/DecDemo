# src/agents/fraud_agent.py
from .base_agent import BaseAgent
from datetime import datetime
import json
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from src.tools.weather_tool import verify_historical_weather
from src.tools.price_tool import verify_market_price
import logging

logger = logging.getLogger(__name__)

class FraudAgent(BaseAgent):
    def __init__(self):
        super().__init__("fraud_agent")
        
        # ✅ Bind BOTH tools
        self.llm_with_tools = self.llm.bind_tools([verify_historical_weather, verify_market_price])
        
        self.system_prompt = """
        You are an elite Insurance Fraud Detection Agent. 
        Your goal is to validate claims against real-world data using your available tools.

        ### YOUR TOOLKIT:
        1. `verify_historical_weather`: Use ONLY if claim mentions weather (rain, flood, hail, storm, snow, ice, wind).
        2. `verify_market_price`: Use whenever a specific repair, part, or medical service is claimed to check if the cost is inflated.

        ### ANALYSIS LOGIC:
        - If user claims $5000 for a repair that online sources say costs $2000 -> FLAG FRAUD (HIGH RISK).
        - If weather was sunny but user claims flood -> FLAG FRAUD (HIGH RISK).
        - If amount is high (> $5000) but consistent with market rates -> LOW RISK.
        - Compare claimed amounts against market research findings.

        ### OUTPUT FORMAT (STRICT JSON):
        {
            "fraud_detected": boolean,
            "risk_score": integer (0-100),
            "reason": "Clear explanation citing the evidence found (e.g., 'Market rate for bumper is $200, user claimed $800')"
        }
        """

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        
        # Prepare inputs
        desc = claim_data.get("description", "")
        date = claim_data.get("incident_date", "").split("T")[0] if claim_data.get("incident_date") else ""
        loc = claim_data.get("location", "Unknown")
        amount = claim_data.get("requested_amount", 0)
        
        user_content = f"""
        Analyze this insurance claim:
        - Amount Requested: ${amount}
        - Description: {desc}
        - Incident Date: {date}
        - Location: {loc}
        """

        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=user_content)
        ]

        # 1. First Inference (LLM decides which tools to call)
        try:
            ai_msg = await self.llm_with_tools.ainvoke(messages)
            messages.append(ai_msg)

            # 2. Tool Execution Loop
            if ai_msg.tool_calls:
                logger.info(f"FraudAgent invoking {len(ai_msg.tool_calls)} tool(s)")
                
                for tool_call in ai_msg.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    
                    tool_output = "Error executing tool"
                    
                    if tool_name == "verify_historical_weather":
                        logger.info(f"Checking weather for {tool_args}")
                        tool_output = await verify_historical_weather.ainvoke(tool_args)
                        logger.info(f"Weather result: {tool_output}")
                        
                    elif tool_name == "verify_market_price":
                        # If vehicle info isn't explicit, extract from description or use generic term
                        if "vehicle_info" not in tool_args:
                            tool_args["vehicle_info"] = "Vehicle"
                        
                        logger.info(f"Checking market prices for {tool_args}")
                        tool_output = verify_market_price.invoke(tool_args)
                        logger.info(f"Price result: {tool_output}")

                    # Append tool result to conversation
                    messages.append(ToolMessage(content=str(tool_output), tool_call_id=tool_call["id"]))

                # 3. Final Inference (Analyze tool outputs)
                final_response = await self.llm.ainvoke(messages)
                content = final_response.content
            else:
                content = ai_msg.content

            # 4. Parse JSON output
            try:
                # Clean up potential markdown formatting ```json ... ```
                clean_content = content.replace("```json", "").replace("```", "").strip()
                result = json.loads(clean_content)
            except Exception as parse_error:
                logger.warning(f"Failed to parse LLM response as JSON: {parse_error}")
                # Fallback if LLM creates bad JSON
                result = {
                    "fraud_detected": True, 
                    "risk_score": 50, 
                    "reason": "AI output parsing failed, flagging for human review."
                }

        except Exception as e:
            logger.error(f"Error in FraudAgent processing: {e}")
            result = {
                "fraud_detected": False,
                "risk_score": 50,
                "reason": f"Error during fraud detection: {str(e)}"
            }

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        confidence = 0.95
        if result.get("fraud_detected"):
            confidence = 0.8  # Lower confidence if fraud flagged to ensure human check

        return self._create_agent_report(confidence, result, processing_time)
