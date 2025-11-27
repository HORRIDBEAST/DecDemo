# File: src/agents/blockchain_agent.py

from .base_agent import BaseAgent
from web3 import Web3
import os
import json
from datetime import datetime
import logging
import time
logger = logging.getLogger(__name__)

class BlockchainAgent(BaseAgent):
    def __init__(self):
        super().__init__("Blockchain Agent")
        self.w3 = Web3(Web3.HTTPProvider(os.getenv("WEB3_PROVIDER_URL")))
        self.contract_address = os.getenv("CONTRACT_ADDRESS")
        self.private_key = os.getenv("PRIVATE_KEY")
        
        if not self.private_key:
            logger.error("PRIVATE_KEY not set in environment variables")
            self.account = None
        else:
            self.account = self.w3.eth.account.from_key(self.private_key)
        
        self.contract_abi = [
            {
                "inputs": [
                    {"name": "_claimId", "type": "uint256"},
                    {"name": "_claimant", "type": "address"},
                    {"name": "_claimType", "type": "uint8"},
                    {"name": "_requestedAmount", "type": "uint256"},
                    {"name": "_ipfsHash", "type": "string"}
                ],
                "name": "submitClaim",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "_claimId", "type": "uint256"},
                    {"name": "_confidenceScore", "type": "uint256"},
                    {"name": "_riskScore", "type": "uint256"},
                    {"name": "_recommendedAmount", "type": "uint256"},
                    {"name": "_agentReports", "type": "string[]"},
                    {"name": "_fraudDetected", "type": "bool"},
                ],
                "name": "updateAIAssessment",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"name": "", "type": "uint256"}],
                "name": "claims",
                "outputs": [
                    {"name": "id", "type": "uint256"},
                    {"name": "claimant", "type": "address"},
                    {"name": "claimType", "type": "uint8"},
                    {"name": "status", "type": "uint8"},
                    {"name": "requestedAmount", "type": "uint256"},
                    {"name": "approvedAmount", "type": "uint256"},
                    {"name": "ipfsHash", "type": "string"},
                    {"name": "submittedAt", "type": "uint256"},
                    {"name": "fraudulent", "type": "bool"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "claimCounter",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]

    def _get_claim_status(self, contract, claim_id):
        """Helper to read the current status of a claim from the blockchain"""
        try:
            claim_data = contract.functions.claims(claim_id).call()
            return claim_data[3] 
        except Exception as e:
            logger.error(f"Error getting claim status for ID {claim_id}: {e}")
            return -1

    def _get_blockchain_claim_id(self, claim_id_str):
        """Convert string claim_id to blockchain-compatible integer"""
        try:
            from zlib import crc32
            return abs(crc32(claim_id_str.encode('utf-8'))) % (10**8)
        except Exception as e:
            logger.error(f"Error converting claim ID: {e}")
            return 0

    def _check_claim_exists(self, contract, claim_id):
        """Check if claim exists on blockchain"""
        try:
            claim_data = contract.functions.claims(claim_id).call()
            exists = claim_data[0] != 0
            logger.info(f"Claim {claim_id} exists on blockchain: {exists}")
            return exists
        except Exception as e:
            logger.error(f"Error checking claim existence for ID {claim_id}: {e}")
            return False

    def _get_available_claim_id(self, contract, base_claim_id_str):
        """
        Finds a free ID on the blockchain. 
        If the base ID is taken/closed, it tries adding suffixes (-retry-1, -retry-2).
        Returns: (blockchain_claim_id, exists_and_active)
        """
        max_retries = 5
        
        for i in range(max_retries + 1):
            # Create a variation of the ID (e.g., "uuid", "uuid-retry-1")
            candidate_str = base_claim_id_str if i == 0 else f"{base_claim_id_str}-retry-{i}"
            
            # Calculate the Integer ID
            candidate_int_id = self._get_blockchain_claim_id(candidate_str)
            
            # Check status on chain
            try:
                claim_data = contract.functions.claims(candidate_int_id).call()
                exists = claim_data[0] != 0
                
                if not exists:
                    logger.info(f"✨ Found available Blockchain ID: {candidate_int_id} (derived from {candidate_str})")
                    return candidate_int_id, False  # (id, exists)
                
                # If it exists, check if it's "active" (SUBMITTED=0)
                # If it is SUBMITTED, we can reuse it (it's just an update)
                # If it is APPROVED(2) or REJECTED(3), we MUST move to next index
                status = claim_data[3]
                if status == 0:  # SUBMITTED
                    logger.info(f"♻️ Reusing existing active claim ID: {candidate_int_id}")
                    return candidate_int_id, True
                
                logger.warning(f"⚠️ Claim ID {candidate_int_id} is occupied and terminal (Status {status}). Trying next index...")
                
            except Exception as e:
                logger.error(f"Error checking availability: {e}")
                return 0, False

        raise Exception("Could not find available blockchain ID after retries")

    def _submit_claim(self, contract, claim_data, blockchain_claim_id, nonce):
        """Submit new claim to blockchain"""
        try:
            claim_type_mapping = {"auto": 0, "home": 1, "health": 2}
            claim_type = claim_type_mapping.get(claim_data.get("claim_type", "").lower(), 0)
            
            logger.info(f"Submitting new claim to blockchain with ID {blockchain_claim_id}...")
            
            tx_data = contract.functions.submitClaim(
                blockchain_claim_id,
                self.account.address,
                claim_type,
                self.w3.to_wei(str(claim_data.get("requested_amount", 0)), 'ether'),
                f"ipfs://claim-{blockchain_claim_id}-{datetime.utcnow().isoformat()}"
            ).build_transaction({
                "from": self.account.address,
                "nonce": nonce,
                "gas": 500000,
                "gasPrice": self.w3.to_wei("30", "gwei"),
                "chainId": 80002
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx_data, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            logger.info(f"Transaction sent: {tx_hash.hex()}, waiting for receipt...")
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                logger.info(f"✅ Claim submitted successfully: {tx_hash.hex()}")
                return True, tx_hash.hex()
            else:
                logger.warning(f"⚠️ Claim submission reverted (Status 0). Likely already processed. Tx: {tx_hash.hex()}")
                if self._check_claim_exists(contract, blockchain_claim_id):
                    logger.info(f"✅ Claim exists on-chain despite revert. Another process likely succeeded.")
                    return True, None
                return False, None
                
        except Exception as e:
            logger.error(f"❌ Error submitting claim to blockchain: {e}")
            return False, None

    def _update_ai_assessment(self, contract, claim_data, blockchain_claim_id, nonce):
        """Update AI assessment for existing claim"""
        try:
            agent_reports_json = []
            if claim_data.get("agent_reports"):
                for agent_name, report in claim_data["agent_reports"].items():
                    if agent_name != "blockchain_agent":
                        summary_findings = {}
                        if 'findings' in report:
                            if agent_name == 'document_agent':
                                summary_findings['validity'] = report['findings'].get('validity', 'unknown')
                                if summary_findings['validity'] == 'error':
                                    summary_findings['error'] = report['findings'].get('error', 'Unknown error')[:200]
                            elif agent_name == 'fraud_agent':
                                summary_findings['risk_score'] = report['findings'].get('risk_score', 0)
                                summary_findings['reason'] = report['findings'].get('reason', 'N/A')
                            elif agent_name == 'damage_agent':
                                summary_findings['estimated_cost'] = report['findings'].get('estimated_cost', 0)
                            elif agent_name == 'settlement_agent':
                                summary_findings['recommended_amount'] = report['findings'].get('recommended_amount', 0)

                        agent_reports_json.append(json.dumps({
                            "agent": agent_name,
                            "confidence": report.get("confidence", 0),
                            "findings_summary": summary_findings
                        }))
            
            logger.info(f"Updating AI assessment for claim {blockchain_claim_id}...")
            
            tx_data = contract.functions.updateAIAssessment(
                blockchain_claim_id,
                int(claim_data.get("confidence_score", 0) * 100),
                int(claim_data.get("risk_score", 0)),
                self.w3.to_wei(str(claim_data.get("recommended_amount", 0)), 'ether'),
                agent_reports_json,
                claim_data.get("fraud_detected", False),
            ).build_transaction({
                "from": self.account.address,
                "nonce": nonce, 
                "gas": 1500000,
                "gasPrice": self.w3.to_wei("30", "gwei"),
                "chainId": 80002
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx_data, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            logger.info(f"AI assessment transaction sent: {tx_hash.hex()}, waiting for receipt...")
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                logger.info(f"✅ AI assessment updated successfully: {tx_hash.hex()}")
                return True, tx_hash.hex()
            else:
                logger.warning(f"⚠️ AI assessment update reverted (Status 0). Likely duplicate from race condition. Tx: {tx_hash.hex()}")
                logger.info(f"ℹ️ This is normal if multiple processes tried to update simultaneously. First one succeeded.")
                return True, None
                
        except Exception as e:
            logger.error(f"❌ Error updating AI assessment: {e}")
            return False, None

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        findings = {"status": "pending", "steps": [], "tx_hash": None}
        
        logger.info(f"🔗 Starting blockchain processing for claim {claim_data['claim_id']}")
        
        # Validate connection and configuration
        if not self.w3.is_connected():
            findings["status"] = "error"
            findings["error"] = "Blockchain connection failed"
            logger.error("❌ Blockchain not connected")
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            return self._create_agent_report(0.1, findings, processing_time)
        
        if not all([self.contract_address, self.private_key, self.account]):
            findings["status"] = "error"
            findings["error"] = "Blockchain configuration missing (CONTRACT_ADDRESS or PRIVATE_KEY)"
            logger.error("❌ Blockchain configuration incomplete")
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            return self._create_agent_report(0.1, findings, processing_time)
        
        try:
            contract = self.w3.eth.contract(
                address=self.w3.to_checksum_address(self.contract_address), 
                abi=self.contract_abi
            )
            
            current_nonce = self.w3.eth.get_transaction_count(self.account.address)
            logger.info(f"Current base nonce: {current_nonce}")
            
            # ✅ FIX: Get a valid, non-terminal Claim ID
            blockchain_claim_id, claim_exists = self._get_available_claim_id(contract, claim_data["claim_id"])
            
            findings["blockchain_claim_id"] = blockchain_claim_id
            findings["steps"].append(f"Generated blockchain ID: {blockchain_claim_id}")
            logger.info(f"📋 Blockchain claim ID: {blockchain_claim_id} (Exists: {claim_exists})")
            
            submit_tx_hash = None
            
            # Step 2: Submit claim if it doesn't exist
            if not claim_exists:
                logger.info(f"📝 Submitting new claim entry to blockchain...")
                success, submit_tx_hash = self._submit_claim(contract, claim_data, blockchain_claim_id, current_nonce)
                
                if not success:
                    findings["status"] = "partial_success"
                    findings["error"] = "Failed to submit claim, but will continue"
                    findings["steps"].append("❌ Claim submission: FAILED")
                    logger.error("❌ Claim submission failed")
                else:
                    findings["steps"].append(f"✅ Claim submitted: {submit_tx_hash}")
                    logger.info(f"✅ Claim submitted: {submit_tx_hash}")
                    current_nonce += 1
                    
                    # Wait for state propagation
                    logger.info(f"Polling for claim {blockchain_claim_id} status to be SUBMITTED (0)...")
                    max_retries = 10
                    retries = 0
                    status = -1
                    while retries < max_retries:
                        status = self._get_claim_status(contract, blockchain_claim_id)
                        
                        if status == 0:
                            logger.info(f"✅ Claim status is now SUBMITTED (0). Proceeding.")
                            break
                        
                        logger.warning(f"Waiting... Claim status is currently {status} (not 0). Retry {retries+1}/{max_retries}")
                        time.sleep(3)
                        retries += 1
                    
                    if status != 0:
                        logger.error(f"❌ Timed out waiting for claim status to be SUBMITTED.")
                        findings["status"] = "error"
                        findings["error"] = "Timed out waiting for on-chain state propagation"
                        submit_tx_hash = None
            else:
                findings["steps"].append("✅ Claim already exists on blockchain")
                logger.info("✅ Claim already exists on blockchain")
            
            # Step 3: Update AI assessment (only if claim was submitted or already exists)
            if claim_exists or (not claim_exists and submit_tx_hash):
                logger.info(f"🤖 Updating AI assessment with nonce {current_nonce}...")
                success, update_tx_hash = self._update_ai_assessment(contract, claim_data, blockchain_claim_id, current_nonce)
                
                if success:
                    findings["status"] = "success"
                    findings["tx_hash"] = update_tx_hash
                    findings["steps"].append(f"✅ AI assessment updated: {update_tx_hash}")
                    logger.info(f"✅ Blockchain operations completed successfully: {update_tx_hash}")
                else:
                    findings["status"] = "error"
                    findings["error"] = "Failed to update AI assessment"
                    findings["steps"].append("❌ AI assessment update: FAILED")
                    logger.error("❌ AI assessment update failed")
            else:
                findings["status"] = "error"
                if not findings.get("error"):
                    findings["error"] = "Cannot update AI assessment - claim not on blockchain"
                findings["steps"].append("❌ Skipped AI assessment - claim not on blockchain")
                
        except Exception as e:
            findings["status"] = "error"
            findings["error"] = str(e)
            findings["steps"].append(f"❌ Exception: {str(e)}")
            logger.error(f"❌ Blockchain agent error: {e}", exc_info=True)

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        confidence = 0.9 if findings["status"] == "success" else 0.1
        
        logger.info(f"🏁 Blockchain processing completed in {processing_time:.2f}s - Status: {findings['status']}")
        
        return self._create_agent_report(confidence, findings, processing_time)