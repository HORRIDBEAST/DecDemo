// lib/types.ts

export enum ClaimStatus {
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  AI_REVIEW = 'ai_review',
  HUMAN_REVIEW = 'human_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  DRAFT = "draft",
}

export enum ClaimType {
  AUTO = 'auto',
  HOME = 'home',
  HEALTH = 'health',
}

export interface User {
  id: string;
  email: string;
  display_name?: string;
  wallet_address?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessingStep {
  step: string;
  completed_at: string;
  details: string;
}

export interface AgentReport {
  confidence: number;
  findings: Record<string, any>;
  processing_time: number;
}

export interface AIAssessment {
  claimId: string;
  confidenceScore: number;
  riskScore: number;
  recommendedAmount: number;
  fraudDetected: boolean;
  fraudReason?: string;
  requiresHumanReview: boolean;
  agentReports: {
    documentAgent: AgentReport;
    damageAgent: AgentReport;
    fraudAgent: AgentReport;
    settlementAgent: AgentReport;
  };
  processingTime: number;
  metadata: {
    tx_hash?: string;
  };
}

export interface Claim {
  id: string;
  user_id: string;
  type: ClaimType;
  status: ClaimStatus;
  requested_amount: number;
  approved_amount?: number;
  description: string;
  document_urls: string[];
  damage_photo_urls: string[];
  incident_date: string;
  location: string;
  ai_assessment?: AIAssessment;
  blockchain_tx_hash?: string;
  approval_tx_hash?: string;
  settlement_tx_hash?: string;
  rejection_reason?: string;
  approved_at?: string;
  rejected_at?: string;
  settled_at?: string;
  processing_steps: ProcessingStep[];
  created_at: string;
  updated_at: string;
}

export interface CreateClaimDTO {
  type: ClaimType;
  requestedAmount: number;
  description: string;
  documentUrls: string[];
  damagePhotoUrls: string[];
  incidentDate: string;
  location: string;
}

export interface ClaimStats {
  total: number;
  byStatus: Record<ClaimStatus, number>;
  byType: Record<ClaimType, number>;
  totalRequested: number;
  totalApproved: number;
  totalSettled: number;
}

export interface PaginatedResponse<T> {
  claims: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface WebSocketNotification {
  type: 'claimStatusUpdate' | 'aiProcessingUpdate' | 'blockchainTransaction' | 'fraudAlert';
  claimId: string;
  status?: ClaimStatus;
  data?: any;
  timestamp: string;
}

export interface FileUploadResponse {
  url: string;
  name: string;
  size: number;
}