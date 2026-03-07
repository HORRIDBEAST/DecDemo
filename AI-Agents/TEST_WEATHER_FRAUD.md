# Test Cases for Enhanced Fraud Detection (Weather + Market Price)

## Weather Verification Test Cases

### Test Case 1: Truthful Weather Claim
```json
{
  "claim_id": "weather-001",
  "claim_type": "AUTO",
  "requested_amount": 3500,
  "description": "Car damaged by heavy rainfall and flooding",
  "document_urls": [],
  "damage_photo_urls": [],
  "incident_date": "2024-07-15",
  "location": "Mumbai"
}
```

### Test Case 2: Fraudulent Weather Claim
```json
{
  "claim_id": "weather-002",
  "claim_type": "AUTO", 
  "requested_amount": 5000,
  "description": "My car got washed away in a massive flood during torrential rain",
  "document_urls": [],
  "damage_photo_urls": [],
  "incident_date": "2024-01-15",
  "location": "Mumbai"
}
```
**Expected:** January 15, 2024 was likely a dry winter day in Mumbai - should trigger fraud detection!

---

## Market Price Verification Test Cases

### Test Case 3: Inflated Price Claim
```json
{
  "claim_id": "price-001",
  "claim_type": "AUTO",
  "requested_amount": 50000,
  "description": "Renault Duster front bumper replacement needed after minor collision",
  "document_urls": [],
  "damage_photo_urls": [],
  "incident_date": "2024-12-20",
  "location": "Pune"
}
```
**Expected:** Market price for bumper replacement is ~$300-500, but user claims $50,000 - HIGH FRAUD!

### Test Case 4: Reasonable Price Claim
```json
{
  "claim_id": "price-002",
  "claim_type": "AUTO",
  "requested_amount": 1500,
  "description": "Honda Civic windshield replacement after rock damage",
  "document_urls": [],
  "damage_photo_urls": [],
  "incident_date": "2024-12-15",
  "location": "Delhi"
}
```
**Expected:** Market price aligns with claim - LOW RISK

### Test Case 5: Combined Test (Weather + Price)
```json
{
  "claim_id": "combo-001",
  "claim_type": "AUTO",
  "requested_amount": 25000,
  "description": "Entire engine flooded and destroyed during massive storm, needs complete replacement",
  "document_urls": [],
  "damage_photo_urls": [],
  "incident_date": "2024-02-10",
  "location": "Bangalore"
}
```
**Expected:** 
- Weather check: February 10 in Bangalore (likely no flood)
- Price check: Engine replacement cost validation
- Should flag BOTH weather mismatch AND price verification

### Test Case 6: Health Claim Price Check
```json
{
  "claim_id": "health-001",
  "claim_type": "HEALTH",
  "requested_amount": 100000,
  "description": "Root canal treatment at dental clinic",
  "document_urls": [],
  "damage_photo_urls": [],
  "incident_date": "2024-12-01",
  "location": "Mumbai"
}
```
**Expected:** Root canal typically costs $50-200 in India, $100,000 is massive fraud!

---

## Testing Methods

### Method 1: Using curl
```bash
curl -X POST http://localhost:8000/process-claim \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "price-fraud-001",
    "claim_type": "AUTO",
    "requested_amount": 50000,
    "description": "Renault Duster front bumper replacement needed",
    "document_urls": [],
    "damage_photo_urls": [],
    "incident_date": "2024-12-20",
    "location": "Pune"
  }'
```

### Method 2: Using Python
```python
import requests

# Test inflated price claim
response = requests.post(
    "http://localhost:8000/process-claim",
    json={
        "claim_id": "price-fraud-001",
        "claim_type": "AUTO",
        "requested_amount": 50000,
        "description": "Renault Duster front bumper replacement needed",
        "document_urls": [],
        "damage_photo_urls": [],
        "incident_date": "2024-12-20",
        "location": "Pune"
    }
)

print(response.json())
```

---

## Expected Agent Behavior

### Weather Tool Activation
The FraudAgent will call `verify_historical_weather` when it detects keywords like:
- rain, flood, storm, hail
- snow, ice, sleet
- wind, hurricane, tornado
- visibility issues, fog

### Price Tool Activation
The FraudAgent will call `verify_market_price` when:
- Specific repair/service is mentioned (bumper, windshield, engine, root canal)
- Amount seems potentially inflated
- Medical procedure or auto part is described

### Combined Analysis
When both tools are used:
1. Weather verification checks actual conditions
2. Price verification checks market rates
3. LLM synthesizes both results
4. Final fraud score considers all evidence

---

## Expected Log Output

### Successful Fraud Detection:
```
INFO: FraudAgent invoking 2 tool(s)
INFO: Checking weather for {'location': 'Mumbai', 'date': '2024-01-15'}
INFO: Weather result: Weather Report for Mumbai on 2024-01-15:
      - Condition: Clear/Cloudy (Code: 3)
      - Precipitation: 0.0 mm
      - Max Wind Speed: 15.2 km/h
INFO: Checking market prices for {'service_name': 'front bumper replacement', 'vehicle_info': 'Renault Duster', 'location': 'Pune'}
INFO: Price result: Market Price Search Results for 'Renault Duster bumper cost Pune':
      - Source: gomechanic.in
        Snippet: Front bumper replacement for Renault Duster costs ₹3,500-5,000...
```

### Result JSON:
```json
{
  "fraud_detected": true,
  "risk_score": 95,
  "reason": "CRITICAL FRAUD DETECTED: 1) User claimed flood damage but weather data shows 0mm precipitation and clear skies on incident date. 2) Market price for bumper replacement is ₹3,500-5,000 but user claimed $50,000 (massive inflation)."
}
```

---

## Environment Setup

Make sure your `.env` file has:
```env
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key
```

Run the server:
```bash
cd "c:\Users\lenovo\Documents\Javascript OG\DecDemo\AI-Agents"
uvicorn src.main:app --reload
```

