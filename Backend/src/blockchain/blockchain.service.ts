import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crc32 from 'crc-32'; // <-- Import the library
// ABI for ClaimRegistry contract (simplified)
const CLAIM_REGISTRY_ABI = [
  "function submitClaim(uint256 _claimId, address _claimant, uint8 _claimType, uint256 _requestedAmount, string memory _ipfsHash) external returns (uint256)",  // ✅ UPDATED
  "function updateAIAssessment(uint256 _claimId, uint256 _confidenceScore, uint256 _riskScore, uint256 _recommendedAmount, string[] memory _agentReports, bool _fraudDetected) external",
  "function approveClaim(uint256 _claimId, uint256 _approvedAmount) external",
  "function rejectClaim(uint256 _claimId, string memory _reason) external",
  "function settleClaim(uint256 _claimId) external payable",
  "function getClaim(uint256 _claimId) external view returns (uint256, address, uint8, uint8, uint256, uint256, string memory, uint256, bool)",
  "function getAIAssessment(uint256 _claimId) external view returns (uint256, uint256, uint256, string[] memory, bool)",
  "event ClaimSubmitted(uint256 indexed claimId, address indexed claimant, uint8 claimType, uint256 requestedAmount)",
  "event ClaimStatusUpdated(uint256 indexed claimId, uint8 status, address indexed updatedBy)",
  "event ClaimApproved(uint256 indexed claimId, uint256 approvedAmount, address indexed approvedBy)",
  "event ClaimSettled(uint256 indexed claimId, uint256 settledAmount, address indexed claimant)",
  "event FraudDetected(uint256 indexed claimId, address indexed claimant, string reason)"
];

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private claimRegistryContract: ethers.Contract;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Initialize provider
      const providerUrl = this.configService.get<string>('WEB3_PROVIDER_URL');
      if (!providerUrl) {
        throw new Error('WEB3_PROVIDER_URL is not configured');
      }
      this.provider = new ethers.JsonRpcProvider(providerUrl);

      // Initialize wallet
      const privateKey = this.configService.get<string>('PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('PRIVATE_KEY is not configured');
      }
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Initialize contract
      const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
      if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS is not configured');
      }
      this.claimRegistryContract = new ethers.Contract(
        contractAddress,
        CLAIM_REGISTRY_ABI,
        this.wallet
      );

      this.logger.log('Blockchain service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize blockchain service:', error);
    }
  }

  // Add this method to BlockchainService to match what blockchain_agent.py does

async submitAndRecordClaim(claimId: string, claimData: any, aiResult: any): Promise<string> {
  try {
    const blockchainClaimId =  this.getBlockchainClaimId(claimId);
    
    this.logger.log(`[Blockchain] Step 1: Checking if claim ${blockchainClaimId} exists...`);
    
    // Check if claim exists
    let claimExists = false;
    try {
      const claimInfo = await this.claimRegistryContract.getClaim(blockchainClaimId);
      claimExists = claimInfo[0] !== BigInt(0);
    } catch (e) {
      claimExists = false;
    }

    // Step 2: Submit claim if it doesn't exist
    if (!claimExists) {
      this.logger.log(`[Blockchain] Step 2: Submitting new claim...`);
      
      const claimTypeMap = { 'auto': 0, 'home': 1, 'health': 2 };
      const claimType = claimTypeMap[claimData.type] || 0;

      const submitTx = await this.claimRegistryContract.submitClaim(
        BigInt(blockchainClaimId),  // ✅ ADD THIS FIRST
        this.wallet.address,        // claimant
        claimType,
        ethers.parseEther(claimData.requested_amount.toString()),
        `ipfs://claim-${claimId}-${Date.now()}`
      );

      const submitReceipt = await submitTx.wait();
      
      if (submitReceipt.status !== 1) {
        throw new Error('Claim submission transaction failed');
      }

      this.logger.log(`[Blockchain] Claim submitted: ${submitReceipt.transactionHash}`);
    } else {
      this.logger.log(`[Blockchain] Claim already exists, skipping submission`);
    }

    // Step 3: Update AI assessment
    this.logger.log(`[Blockchain] Step 3: Updating AI assessment...`);
    
    const tx = await this.claimRegistryContract.updateAIAssessment(
      BigInt(blockchainClaimId),
      BigInt(aiResult.confidenceScore),
      BigInt(aiResult.riskScore),
      ethers.parseEther(aiResult.recommendedAmount.toString()),
      [
        JSON.stringify(aiResult.agentReports.documentAgent),
        JSON.stringify(aiResult.agentReports.damageAgent),
        JSON.stringify(aiResult.agentReports.fraudAgent),
        JSON.stringify(aiResult.agentReports.settlementAgent),
      ],
      aiResult.fraudDetected,
      // `ipfs://assessment-${claimId}-${Date.now()}`
    );

    const receipt = await tx.wait();
    
    if (receipt.status !== 1) {
      throw new Error('AI assessment update transaction failed');
    }

    this.logger.log(`[Blockchain] AI assessment recorded: ${receipt.transactionHash}`);
    
    return receipt.transactionHash;

  } catch (error) {
    this.logger.error(`[Blockchain] Failed to submit and record claim ${claimId}:`, error);
    throw error;
  }
}
  async recordClaimAssessment(claimId: string, aiResult: any): Promise<string> {
    try {
      // Convert string claimId to blockchain claim ID
      const blockchainClaimId =  this.getBlockchainClaimId(claimId);
      
      const tx = await this.claimRegistryContract.updateAIAssessment(
        BigInt(blockchainClaimId),
        BigInt(aiResult.confidenceScore),
        BigInt(aiResult.riskScore),
        ethers.parseEther(aiResult.recommendedAmount.toString()),
        [
          JSON.stringify(aiResult.agentReports.documentAgent),
          JSON.stringify(aiResult.agentReports.damageAgent),
          JSON.stringify(aiResult.agentReports.fraudAgent),
          JSON.stringify(aiResult.agentReports.settlementAgent),
        ],
        aiResult.fraudDetected,
        // `ipfs://assessment-${claimId}-${Date.now()}`
      );

      const receipt = await tx.wait();
      this.logger.log(`AI assessment recorded on blockchain: ${receipt.transactionHash}`);
      
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to record AI assessment for claim ${claimId}:`, error);
      throw error;
    }
  }

  async approveClaim(claimId: string, approvedAmount: number): Promise<string> {
    try {
      const blockchainClaimId =  this.getBlockchainClaimId(claimId);
      
      const tx = await this.claimRegistryContract.approveClaim(
        blockchainClaimId,
        ethers.parseEther(approvedAmount.toString())
      );

      const receipt = await tx.wait();
      this.logger.log(`Claim ${claimId} approved on blockchain: ${receipt.transactionHash}`);
      
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to approve claim ${claimId} on blockchain:`, error);
      throw error;
    }
  }

  async rejectClaim(claimId: string, reason: string): Promise<string> {
    try {
      const blockchainClaimId =  this.getBlockchainClaimId(claimId);
      
      const tx = await this.claimRegistryContract.rejectClaim(
        blockchainClaimId,
        reason
      );

      const receipt = await tx.wait();
      this.logger.log(`Claim ${claimId} rejected on blockchain: ${receipt.transactionHash}`);
      
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to reject claim ${claimId} on blockchain:`, error);
      throw error;
    }
  }

  async settleClaim(claimId: string, amount: number): Promise<string> {
    try {
      const blockchainClaimId =  this.getBlockchainClaimId(claimId);
      const value = ethers.parseEther(amount.toString());
      
      const tx = await this.claimRegistryContract.settleClaim(
        blockchainClaimId,
        { value }
      );

      const receipt = await tx.wait();
      this.logger.log(`Claim ${claimId} settled on blockchain: ${receipt.transactionHash}`);
      
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to settle claim ${claimId} on blockchain:`, error);
      throw error;
    }
  }

  async submitClaimToBlockchain(claimData: any): Promise<{ claimId: number; txHash: string }> {
    try {
      // Map claim type to blockchain enum
      const claimTypeMap = {
        'auto': 0,
        'home': 1,
        'health': 2,
      };

      const tx = await this.claimRegistryContract.submitClaim(
        claimTypeMap[claimData.type] || 0,
        ethers.parseEther(claimData.requestedAmount.toString()),
        `ipfs://claim-${claimData.id}-${Date.now()}`
      );

      const receipt = await tx.wait();
      
      // Extract claim ID from event
      const event = receipt.logs?.find(log => {
        try {
          const parsedLog = this.claimRegistryContract.interface.parseLog(log);
          return parsedLog?.name === 'ClaimSubmitted';
        } catch {
          return false;
        }
      });
      
      let blockchainClaimId = 0;
      if (event) {
        const parsedEvent = this.claimRegistryContract.interface.parseLog(event);
        blockchainClaimId = parsedEvent?.args?.claimId?.toNumber() || 0;
      }

      this.logger.log(`Claim submitted to blockchain with ID ${blockchainClaimId}: ${receipt.transactionHash}`);
      
      return {
        claimId: blockchainClaimId,
        txHash: receipt.transactionHash,
      };
    } catch (error) {
      this.logger.error(`Failed to submit claim to blockchain:`, error);
      throw error;
    }
  }

  async getClaimFromBlockchain(blockchainClaimId: number) {
    try {
      const claimData = await this.claimRegistryContract.getClaim(blockchainClaimId);
      const aiAssessment = await this.claimRegistryContract.getAIAssessment(blockchainClaimId);

      return {
        claim: {
          id: claimData[0].toNumber(),
          claimant: claimData[1],
          claimType: claimData[2],
          status: claimData[3],
          requestedAmount: ethers.formatEther(claimData[4]),
          approvedAmount: ethers.formatEther(claimData[5]),
          ipfsHash: claimData[6],
          submittedAt: new Date(claimData[7].toNumber() * 1000),
          fraudulent: claimData[8],
        },
        assessment: {
          confidenceScore: aiAssessment[0].toNumber(),
          riskScore: aiAssessment[1].toNumber(),
          recommendedAmount: ethers.formatEther(aiAssessment[2]),
          agentReports: aiAssessment[3],
          fraudDetected: aiAssessment[4],
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get claim from blockchain:`, error);
      throw error;
    }
  }

 private getBlockchainClaimId(claimIdStr: string): number {
    // We use crc32.str to match Python's crc32 on the string's byte representation
    // The `& 0xffffffff` ensures we get an unsigned 32-bit integer
    // The abs() and modulo match the Python agent's logic
    const hash = crc32.str(claimIdStr) & 0xffffffff;
    return (hash % (10**8));
  }

  async listenToContractEvents(callback: (event: any) => void) {
    // Listen to all contract events
    this.claimRegistryContract.on('*', (event) => {
      this.logger.log(`Blockchain event received: ${event.event}`);
      callback(event);
    });
  }

  async getGasEstimate(method: string, params: any[]): Promise<bigint> {
    try {
      const gasEstimate = await this.claimRegistryContract[method].estimateGas(...params);
      return gasEstimate;
    } catch (error) {
      this.logger.error(`Failed to estimate gas for ${method}:`, error);
      return BigInt(500000); // Fallback gas limit
    }
  }

  async getTransactionStatus(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = tx ? await this.provider.getTransactionReceipt(txHash) : null;

      return {
        transaction: tx,
        receipt: receipt,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        confirmations: receipt ? receipt.confirmations : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get transaction status for ${txHash}:`, error);
      return { status: 'error', error: error.message };
    }
  }
}