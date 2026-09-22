import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface ClaimProcessingRequest {
  claimId: string;
  userId?: string;
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
  assessmentStatus: 'PRE_APPROVED' | 'REQUIRES_HUMAN_REVIEW' | 'REJECTED_FRAUD';
  requiresHumanReview: boolean;
  agentReports: {
    documentAgent: any;
    damageAgent: any;
    fraudAgent: any;
    settlementAgent: any;
  };
  processingTime: number;
  metadata: any;
  // True when the AI service could not be reached; the scores are placeholders, not a verdict.
  processingFailed?: boolean;
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

  // Free-tier hosts spin the AI service down when idle. The first request then gets a 429/502/503
  // from the platform proxy while the service boots (~45s on Render), so wait and retry instead of
  // failing the claim. Only connect-phase errors and gateway statuses are retried: a read timeout
  // could mean the claim is still being processed, and retrying it would run it twice.
  private readonly retryDelaysMs = [3000, 5000, 8000, 12000, 15000, 20000, 25000];
  private readonly retryableStatuses = new Set([429, 502, 503]);
  private readonly retryableCodes = new Set(['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN']);

  private isServiceWakingUp(error: any): boolean {
    const status = error?.response?.status;
    if (status) return this.retryableStatuses.has(status);
    return this.retryableCodes.has(error?.code);
  }

  private async postWithWakeRetry(url: string, body: unknown) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await firstValueFrom(
          this.httpService.post(url, body, {
            timeout: 300000,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      } catch (error) {
        if (!this.isServiceWakingUp(error) || attempt >= this.retryDelaysMs.length) throw error;
        const delay = this.retryDelaysMs[attempt];
        this.logger.warn(
          `AI service not ready (${error.response?.status ?? error.code}); retry ${attempt + 1}/${this.retryDelaysMs.length} in ${delay / 1000}s`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async processClaim(request: ClaimProcessingRequest): Promise<AIAssessmentResult> {
    try {
      this.logger.log(`Starting AI processing for claim ${request.claimId}`);

      // Convert camelCase to snake_case for AI agents API
      const aiAgentsRequest = {
        claim_id: request.claimId,
        user_id: request.userId,
        claim_type: request.claimType,
        requested_amount: request.requestedAmount,
        description: request.description,
        document_urls: request.documentUrls || [],
        damage_photo_urls: request.damagePhotoUrls || [],
        incident_date: request.incidentDate || new Date().toISOString(),
        location: request.location || 'Unknown',
      };

      this.logger.log(`Sending request to AI agents: ${JSON.stringify(aiAgentsRequest)}`);

      const response = await this.postWithWakeRetry(`${this.aiAgentsUrl}/process-claim`, aiAgentsRequest);

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
        assessmentStatus: result.assessment_status,
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
        riskScore: 0,
        recommendedAmount: 0,
        fraudDetected: false,
        fraudReason: 'The AI service was unavailable, so this claim was not assessed. Please re-submit it.',
        processingFailed: true,
        assessmentStatus: 'REQUIRES_HUMAN_REVIEW',
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
