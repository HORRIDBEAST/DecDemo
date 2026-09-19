# CLAUDE.md — DecentralizedClaim

## What this project is

AI-powered insurance claim processing with blockchain transparency. A LangGraph multi-agent pipeline (Document → Damage → Fraud → Settlement → Blockchain) processes claims submitted through a Next.js frontend, orchestrated by a NestJS backend, with results recorded immutably on-chain.

Author: Rajas Deshpande. Repo: `DecDemo`. Full architecture/tech stack/setup details are in `README.md` at repo root — read that first for anything not covered here (ports, env vars, install steps, API endpoints).

## Repo structure

```
front/           Next.js 14 frontend (App Router)
Backend/         NestJS backend (claims, auth, blockchain, websocket modules)
AI-Agents/       Python/FastAPI, LangGraph agent workflow
Block/           Solidity contracts + Hardhat
```

Key files for this session's work:
- `AI-Agents/src/agents/document_agent.py`
- `AI-Agents/src/agents/damage_agent.py`
- `AI-Agents/src/agents/fraud_agent.py`
- `AI-Agents/src/agents/settlement_agent.py`
- `AI-Agents/src/agents/blockchain_agent.py`
- `AI-Agents/src/workflows/claim_workflow.py` (LangGraph DAG + `_determine_outcome`, the routing logic)
- `Backend/src/blockchain/blockchain.service.ts`
- `Block/contracts/ClaimRegistry.sol`
- `Block/hardhat.config.js`

## ⚡ CURRENT GOAL: Monad migration (hackathon)

This project was originally built and demoed against **Polygon Amoy testnet**. We are migrating it to **Monad** for a Monad hackathon (Monad Blitz Mumbai, one-day sprint, ~6 hours of build time). Do not assume Amoy anywhere going forward — it's being replaced, not kept as a fallback.

Monad is fully EVM/Solidity-compatible, so `ClaimRegistry.sol` does **not** need Solidity changes. This is a config/redeploy migration, not a rewrite.

**Use testnet, not mainnet**, unless hackathon rules explicitly require mainnet (real MON, real money — unlikely for a one-day event). Verify against the rules before assuming.

### Network facts (confirmed current as of this session — verify against `docs.monad.xyz` if it's been a while)

| | Monad Testnet (use this) | Monad Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Faucet | `https://faucet.monad.xyz` | n/a |
| Explorer | `https://testnet.monadexplorer.com` | `https://monadvision.com` |
| Currency | MON | MON |

### Migration checklist

1. **Fund wallets first** — get testnet MON from the faucet into the deployer wallet and the AI-agent wallet (if different addresses) before anything else. Faucets can have per-wallet cooldowns.
2. **Hardhat**: add a `monadTestnet` network block in `Block/hardhat.config.js` (RPC + chainId above). Redeploy `ClaimRegistry.sol` unchanged: `npx hardhat run scripts/deploy.js --network monadTestnet`.
3. **Grant roles on the new contract instance** — this is a fresh deploy, so `addAuthorizedAgent(agentWalletAddress)` and `addValidator(validatorAddress)` must be called again by the owner. Easy to forget.
4. **Env vars** — update `WEB3_PROVIDER_URL` and `CONTRACT_ADDRESS` in `Backend/.env`, `AI-Agents/.env`, and `Block/.env`.
5. **Hardcoded chain IDs** — search for `80002` (Amoy's chain ID) and replace with `10143`:
   - `Backend/src/blockchain/blockchain.service.ts` (tx `build_transaction`/similar calls)
   - `AI-Agents/src/agents/blockchain_agent.py` — appears in both `_submit_claim` and `_update_ai_assessment` (`"chainId": 80002`)
6. **Gas price** — `blockchain_agent.py` hardcodes `self.w3.to_wei("30", "gwei")`. Change to dynamic: `gas_price = self.w3.eth.gas_price`. Monad's fee market isn't Polygon's; hardcoding invites "transaction underpriced" failures mid-demo.
7. **Explorer links** — frontend `POLYGONSCAN_URL` constant (in claim details view) → `https://testnet.monadexplorer.com/tx/`.
8. **README/branding** — badges, "Polygon Amoy" mentions, PolygonScan links in `README.md` should eventually be updated to Monad, but that's cosmetic — do the functional migration first.

### Sequencing advice

Do the Monad migration **before** the agent fixes below. If anything chain-specific surprises us, we want to hit it early with time to fix it, not right before a demo. The agent fixes are pure Python logic with no external-chain dependency — safer to do second.

## 🧠 Agent fixes to apply (fraud detection accuracy)

Context: we ran a set of fraud-detection test cases (mismatched amounts, locations, dates, damage type, weather-impossible claims, price inflation, etc.) against the current pipeline. Two of the originally-proposed quick fixes (from another AI's suggestion) were incomplete or risky. Below is the corrected version. **Apply all three sub-fixes together for each item** — a partial fix will silently not change routing outcomes even though it looks like it should.

### Fix A — Vision-confirmed fraud, gated on vision actually having run

**Problem**: `damage_agent.py`'s `damage_detected` defaults to `False` and stays `False` in two very different cases: (a) vision model reviewed the photo and confirmed it doesn't match the claim, or (b) the vision API call failed/timed out and never ran. A naive fix that punishes `damage_detected == False` unconditionally will auto-reject legitimate claims whenever the vision API hiccups — the worst possible failure mode for a live demo.

**Fix**, in `fraud_agent.py`, replace the current invalid-evidence check with:

```python
vision_ran = damage_report.get("findings", {}).get("image_analysis_performed", False)
damage_detected = damage_report.get("findings", {}).get("damage_detected", True)

if vision_ran and not damage_detected:
    # Vision model explicitly reviewed the photo and it does NOT match the claim
    findings["risk_score"] += 80
    forced_fraud = True
    findings["red_flags"].append(
        "CRITICAL: Vision analysis confirms photo does not match claimed damage/type"
    )
elif not vision_ran:
    # Infra failure, not a fraud signal — don't punish the user for API flakiness
    findings["risk_score"] += 25
    findings["red_flags"].append("Vision analysis unavailable — manual verification required")
```

This replaces the old flat `+35` "invalid evidence" penalty for this specific case — check for and remove any duplicate scoring so it isn't double-counted.

**Expected outcome after fix**: a photo that doesn't match the claimed damage/type → `REJECTED_FRAUD`. A vision-API failure → routed to human review, never auto-rejected.

### Fix B — Date mismatch actually needs two changes, not one

**Problem**: adding a red-flag check alone for "document dated after the incident" isn't enough — it needs to actually change routing, and currently it wouldn't.

**Fix B1**, in `document_agent.py`, extend the existing backdating check with an `elif` for post-incident document dates:

```python
if parsed_date < incident_date - timedelta(days=30):
    findings["red_flags"].append(
        f"Document date {parsed_date.strftime('%Y-%m-%d')} is >30 days before incident"
    )
    findings["validity"] = "suspicious"
elif parsed_date > incident_date + timedelta(days=5):
    findings["red_flags"].append(
        f"Document date {parsed_date.strftime('%Y-%m-%d')} is after the incident date {incident_date.strftime('%Y-%m-%d')}"
    )
    findings["validity"] = "suspicious"
```

**Fix B2 (the part that's easy to skip and then wonder why nothing changed)**, in `claim_workflow.py`'s `_determine_outcome`, the `document_mismatch` variable currently only checks `doc_amount_mismatch` — a date-only red flag never reaches the 40-point review threshold on its own. Widen it:

```python
document_mismatch = bool(document_findings.get("doc_amount_mismatch")) or (
    document_findings.get("validity") == "suspicious"
)
```

**Expected outcome after both B1 and B2**: a document dated after the incident → `REQUIRES_HUMAN_REVIEW` (not silently `PRE_APPROVED`).

### Fix C — Location/description semantic check (stretch goal, not priority)

Do **not** implement geocoding or fuzzy string matching for addresses — brittle ("Shivajinagar, Pune" vs "Pune, Shivaji Nagar 411005" fails naive comparison) and adds a new external dependency + latency right before a demo.

If there's spare time, a cheap alternative: piggyback a second lightweight LLM call in `document_agent.py` (reusing the LLM client already used in `_classify_document_type`) that does semantic comparison instead of string/geo matching:

```python
comparison_prompt = f"""
Claim form says location: "{claim_data.get('location')}"
Document text mentions: "{text[:500]}"

Does the document's location reasonably match the claimed location
(allow for different formatting/abbreviations)? Answer only: MATCH, MISMATCH, or UNCLEAR.
"""
```

Degrade gracefully on `UNCLEAR` — don't penalize. This is genuinely optional; skip it if time is short.

### Test case notes

The current architecture is **graduated** (risk-score accumulation → `REQUIRES_HUMAN_REVIEW`), and only overwhelming evidence (extreme price ratios, weather contradiction, confirmed-fake photo after Fix A) triggers a hard `REJECTED_FRAUD`. Test expectations and demo narration should say "flagged for review" for type/date/amount mismatches, not "rejected" — don't let the demo script promise "rejected" and then show "human review" on stage.

For a valid/clean test claim, use a `user_id` with **zero prior claims** in Supabase — the frequent-claimer penalty in `fraud_agent.py` (`+20` to `+40` based on claim count in the last 365 days) will otherwise contaminate an intended "clean approval" demo case.

## Ground rules for this session

- Don't reintroduce Polygon/Amoy-specific values (`80002`, Alchemy Amoy RPC URLs, PolygonScan links) in any new code — Monad is the target chain now.
- Don't widen the vision-fraud check beyond what Fix A specifies — the whole point is avoiding false positives on API failure. If unsure whether `image_analysis_performed` is being read correctly, check `damage_agent.py`'s `findings` dict construction before assuming the fraud agent's read is wrong.
- Keep changes to `claim_workflow.py`'s `_determine_outcome` minimal and additive — it's the single source of truth for routing, and the risk-score thresholds elsewhere are tuned around its current shape.
- This is hackathon time-boxed work (originally 6 hours). Prioritize: (1) Monad migration functional end-to-end, (2) Fix A, (3) Fix B, (4) Fix C only if time remains, (5) cosmetic README/branding updates last.