# 🚀 Quick Start Guide: Test Your MCP-Enabled Fraud Detection

## Step 1: Setup Environment

1. **Copy your environment variables:**
   ```bash
   cd "c:\Users\lenovo\Documents\Javascript OG\DecDemo\AI-Agents"
   cp .env.example .env
   ```

2. **Add your OPENAI_API_KEY to `.env`:**
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   TAVILY_API_KEY=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
   ```

## Step 2: Start the Server

```bash
cd "c:\Users\lenovo\Documents\Javascript OG\DecDemo\AI-Agents"
uvicorn src.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Step 3: Run a Test Claim

### Option A: Using PowerShell
```powershell
$body = @{
    claim_id = "test-mcp-001"
    claim_type = "AUTO"
    requested_amount = 50000
    description = "Renault Duster front bumper replacement after minor collision"
    incident_date = "2024-12-20"
    location = "Pune"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/process-claim" -Body $body -ContentType "application/json"
```

### Option B: Using Python
```python
import requests

response = requests.post(
    "http://localhost:8000/process-claim",
    json={
        "claim_id": "test-mcp-001",
        "claim_type": "AUTO",
        "requested_amount": 50000,
        "description": "Renault Duster front bumper replacement after minor collision",
        "incident_date": "2024-12-20",
        "location": "Pune"
    }
)

result = response.json()
print(f"Fraud Detected: {result['fraud_detected']}")
print(f"Risk Score: {result['risk_score']}")
print(f"Reason: {result.get('agent_reports', {}).get('fraud_agent', {}).get('findings', {}).get('reason')}")
```

## Step 4: Watch the Logs

In your terminal where the server is running, you should see:

```
INFO:     Processing fraud detection for claim test-mcp-001
INFO:     FraudAgent invoking 1 tool(s)
INFO:     Checking market prices for {'service_name': 'front bumper replacement', 'vehicle_info': 'Renault Duster', 'location': 'Pune'}
INFO:     Price result: Market Price Search Results...
           - Source: gomechanic.in
             Snippet: Front bumper replacement for Renault Duster costs ₹3,500-5,000...
```

## Step 5: Verify the Result

Expected response:
```json
{
  "claim_id": "test-mcp-001",
  "fraud_detected": true,
  "risk_score": 95,
  "confidence_score": 80,
  "recommended_amount": 0,
  "requires_human_review": true,
  "agent_reports": {
    "fraud_agent": {
      "confidence": 0.8,
      "findings": {
        "fraud_detected": true,
        "risk_score": 95,
        "reason": "Market price for Renault Duster bumper replacement is approximately ₹3,500-5,000 ($42-60), but user claimed $50,000. This represents a 800x+ price inflation - clear indication of fraud."
      }
    }
  }
}
```

## 🎯 What Just Happened?

1. ✅ **Claim Submitted** - User claimed $50,000 for bumper replacement
2. ✅ **FraudAgent Activated** - Analyzed the description
3. ✅ **Tool Decision** - LLM detected "bumper replacement" and decided to check prices
4. ✅ **Tavily Search** - Searched "Renault Duster bumper cost Pune"
5. ✅ **Evidence Gathered** - Found market price is ₹3,500-5,000
6. ✅ **Fraud Detected** - 800x inflation = obvious fraud!

## 🧪 More Test Cases

### Test 2: Weather Fraud
```json
{
  "claim_id": "test-weather-001",
  "claim_type": "AUTO",
  "requested_amount": 8000,
  "description": "Car damaged in massive flood during monsoon storm",
  "incident_date": "2024-01-15",
  "location": "Mumbai"
}
```
**Expected:** Weather check shows no rain in January (dry season) → Fraud!

### Test 3: Legitimate Claim
```json
{
  "claim_id": "test-legit-001",
  "claim_type": "AUTO",
  "requested_amount": 400,
  "description": "Honda Civic windshield replacement due to rock damage",
  "incident_date": "2024-12-15",
  "location": "Delhi"
}
```
**Expected:** Price aligns with market → Low risk!

### Test 4: Combined (Weather + Price)
```json
{
  "claim_id": "test-combo-001",
  "claim_type": "AUTO",
  "requested_amount": 75000,
  "description": "Entire engine flooded and destroyed in massive storm",
  "incident_date": "2024-02-10",
  "location": "Bangalore"
}
```
**Expected:** BOTH tools called → Weather check + Price check → Double fraud detection!

## 📱 Frontend Integration

To test from your React frontend, the API is already configured at:
```
POST http://localhost:8000/process-claim
```

Your existing claim submission code should work without changes!

## 🐛 Troubleshooting

### Issue: "TAVILY_API_KEY not set"
**Solution:** Make sure `.env` file exists with the key

### Issue: "OPENAI_API_KEY not set"
**Solution:** Add your OpenAI key to `.env`

### Issue: Tools not being called
**Solution:** Check the description - make sure it mentions specific repairs or weather

### Issue: Slow response
**Solution:** Normal! API calls take 3-8 seconds. This is expected.

## ✨ Success Indicators

You'll know it's working when you see:
- ✅ Log message: "FraudAgent invoking X tool(s)"
- ✅ Log message: "Checking market prices for..."
- ✅ Log message: "Price result: Market Price Search Results..."
- ✅ Response includes detailed `reason` with evidence

---

**Ready to test? Fire up the server and try it! 🚀**
