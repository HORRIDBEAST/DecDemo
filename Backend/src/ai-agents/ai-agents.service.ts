import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface ClaimProcessingRequest {
  claimId: string;
  claimType: string;
  requestedAmount: number;
  description: string;
  documentUrls: string[];
  damagePhotoUrls: string[];
  incidentDate?: string;
  location?: string;
}

interface AIAssessmentResult {
  claimId: string;
  confidenceScore: number;
  riskScore: number;
  recommendedAmount: number;
  fraudDetected: boolean;
  fraudReason?: string;
  requiresHumanReview: boolean;
  agentReports: {
    documentAgent: any;
    damageAgent: any;
    fraudAgent: any;
    settlementAgent: any;
  };
  processingTime: number;
  metadata: any;
}

@Injectable()
export class AiAgentsService {
  private readonly logger = new Logger(AiAgentsService.name);
  private readonly aiAgentsUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiAgentsUrl = this.configService.get<string>('AI_AGENTS_URL', 'http://127.0.0.1:8000');
  }

  async processClaim(request: ClaimProcessingRequest): Promise<AIAssessmentResult> {
    try {
      this.logger.log(`Starting AI processing for claim ${request.claimId}`);

      // Convert camelCase to snake_case for AI agents API
      const aiAgentsRequest = {
        claim_id: request.claimId,
        claim_type: request.claimType,
        requested_amount: request.requestedAmount,
        description: request.description,
        document_urls: request.documentUrls || [],
        damage_photo_urls: request.damagePhotoUrls || [],
        incident_date: request.incidentDate || new Date().toISOString(),
        location: request.location || 'Unknown',
      };

      this.logger.log(`Sending request to AI agents: ${JSON.stringify(aiAgentsRequest)}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiAgentsUrl}/process-claim`, aiAgentsRequest, {
          timeout: 300000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const result = response.data;
      
      this.logger.log(
        `AI processing completed for claim ${request.claimId} with confidence ${result.confidence_score}%`
      );

      // Convert snake_case response back to camelCase
      return {
        claimId: result.claim_id,
        confidenceScore: result.confidence_score,
        riskScore: result.risk_score,
        recommendedAmount: result.recommended_amount,
        fraudDetected: result.fraud_detected,
        fraudReason: result.fraud_reason,
        requiresHumanReview: result.requires_human_review,
        agentReports: {
          documentAgent: result.agent_reports.document_agent,
          damageAgent: result.agent_reports.damage_agent,
          fraudAgent: result.agent_reports.fraud_agent,
          settlementAgent: result.agent_reports.settlement_agent,
        },
        processingTime: result.processing_time,
        metadata: result.metadata,
      };
    } catch (error) {
      this.logger.error(`AI processing failed for claim ${request.claimId}:`, error.response?.data || error.message);
      
      return {
        claimId: request.claimId,
        confidenceScore: 0,
        riskScore: 100,
        recommendedAmount: 0,
        fraudDetected: false,
        requiresHumanReview: true,
        agentReports: {
          documentAgent: { error: 'Processing failed' },
          damageAgent: { error: 'Processing failed' },
          fraudAgent: { error: 'Processing failed' },
          settlementAgent: { error: 'Processing failed' },
        },
        processingTime: 0,
        metadata: { error: error.response?.data || error.message },
      };
    }
  }

  async getProcessingStatus(claimId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiAgentsUrl}/claims/${claimId}/status`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get processing status for claim ${claimId}:`, error.message);
      throw error;
    }
  }

  async retryProcessing(claimId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiAgentsUrl}/claims/${claimId}/retry`)
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to retry processing for claim ${claimId}:`, error.message);
      throw error;
    }
  }
}