import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AiAgentsService } from '../ai-agents/ai-agents.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationGateway } from '../websocket/notification.gateway';
import { CreateClaimDto, ClaimType } from './dto/create-claim.dto';
import { UpdateClaimDto, ClaimStatus } from './dto/update-claim.dto';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    private supabaseService: SupabaseService,
    private aiAgentsService: AiAgentsService,
    private blockchainService: BlockchainService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(userId: string, createClaimDto: CreateClaimDto) {
    const supabase = this.supabaseService.getAdminClient();
    
    const claimData = {
      user_id: userId,
      type: createClaimDto.type,
      requested_amount: createClaimDto.requestedAmount,
      description: createClaimDto.description,
      document_urls: [],
      damage_photo_urls:  [],
      incident_date: createClaimDto.incidentDate,
      location: createClaimDto.location,
      status: ClaimStatus.DRAFT,
      processing_steps: [
        {
          step: 'draft',
          completed_at: new Date().toISOString(),
          details: 'Claim draft created',
        }
      ],
    };

    const { data, error } = await supabase
      .from('claims')
      .insert([claimData])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating claim:', error);
      throw error;
    }

    this.notificationGateway.notifyClaimStatusUpdate(
      userId,
      data.id,
      ClaimStatus.DRAFT
    );

    return data;
  }

  async findAllPending(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
    
    if (user?.role !== 'admin') {
        this.logger.warn(`Non-admin user ${userId} attempted to access admin claims`);
        return [];
    }

    const { data, error } = await supabase
      .from('claims')
      .select('*, users(display_name, email)')
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Error fetching admin claims:', error);
      throw error;
    }

    this.logger.log(`Fetched ${data?.length || 0} admin claims`);
    return data;
  }

  private async createNotification(userId: string, title: string, message: string, claimId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      claim_id: claimId
    });
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const supabase = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Error fetching claims:', error);
      throw error;
    }

    const { count, error: countError } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      this.logger.error('Error counting claims:', countError);
      throw countError;
    }

    return {
      claims,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
      },
    };
  }

  async findOne(id: string, userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    let isAdmin = false;
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (user?.role === 'admin') {
        isAdmin = true;
      }
    }

    let query = supabase
      .from('claims')
      .select('*, users(display_name, email, wallet_address)') 
      .eq('id', id);

    if (userId && !isAdmin) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();
    
    if (error || !data) {
      this.logger.warn(`Claim ${id} not found for user ${userId} (Admin: ${isAdmin})`);
      throw new NotFoundException('Claim not found or access denied');
    }

    return data;
  }

  async update(id: string, userId: string, updateClaimDto: UpdateClaimDto) {
    const supabase = this.supabaseService.getAdminClient();
    
    await this.findOne(id, userId);

    const updateData: any = {};
    if (updateClaimDto.requestedAmount !== undefined) updateData.requested_amount = updateClaimDto.requestedAmount;
    if (updateClaimDto.documentUrls !== undefined) updateData.document_urls = updateClaimDto.documentUrls;
    if (updateClaimDto.damagePhotoUrls !== undefined) updateData.damage_photo_urls = updateClaimDto.damagePhotoUrls;
    if (updateClaimDto.incidentDate !== undefined) updateData.incident_date = updateClaimDto.incidentDate;
    if (updateClaimDto.location !== undefined) updateData.location = updateClaimDto.location;
    if (updateClaimDto.type !== undefined) updateData.type = updateClaimDto.type;
    if (updateClaimDto.description !== undefined) updateData.description = updateClaimDto.description;
    if (updateClaimDto.status !== undefined) updateData.status = updateClaimDto.status;
    
    // ✅ FIX: If resetting to DRAFT (Retry Flow), clear previous evidence of processing
    if (updateClaimDto.status === ClaimStatus.DRAFT) {
       updateData.ai_assessment = null;
       updateData.blockchain_tx_hash = null;
       updateData.approval_tx_hash = null;
       updateData.settlement_tx_hash = null;
       updateData.rejection_reason = null;
       updateData.approved_amount = null;
       updateData.rejected_at = null;
       updateData.approved_at = null;
       updateData.settled_at = null;
       
       // ✅ Add log entry to processing_steps indicating a retry
       const currentClaim = await this.findOne(id, userId);
       updateData.processing_steps = [
         ...(currentClaim.processing_steps || []),
         {
           step: 'claim_reset_for_retry',
           completed_at: new Date().toISOString(),
           details: 'Claim reset to draft for re-submission after rejection or edits',
         }
       ];
       
       this.logger.log(`[Claim ${id}] Reset to DRAFT for retry - cleared AI assessment and blockchain records`);
    }
    
    const { data, error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating claim:', error);
      throw error;
    }

    if (updateClaimDto.status) {
      this.notificationGateway.notifyClaimStatusUpdate(
        userId,
        id,
        updateClaimDto.status
      );
    }

    return data;
  }

  async submitForProcessing(claimId: string, userId: string) {
    this.logger.log(`[Claim ${claimId}] Submit for processing requested by user ${userId}`);
    
    const claim = await this.findOne(claimId, userId);

    if (claim.status !== ClaimStatus.DRAFT) {
      throw new BadRequestException('Claim has already been submitted.');
    }

    if (!claim.document_urls || claim.document_urls.length === 0) {
      throw new BadRequestException('Cannot submit claim: At least one document is required.');
    }
    if (!claim.damage_photo_urls || claim.damage_photo_urls.length === 0) {
      throw new BadRequestException('Cannot submit claim: At least one damage photo is required.');
    }

    await this.updateClaimStatus(claimId, ClaimStatus.SUBMITTED);
    
    this.notificationGateway.notifyClaimStatusUpdate(
      userId,
      claimId,
      ClaimStatus.SUBMITTED
    );

    const supabase = this.supabaseService.getAdminClient();
    const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
     
    if (admins) {
      for (const admin of admins) {
        await this.createNotification(
          admin.id, 
          'New Claim Submitted', 
          `User ${userId} submitted claim ${claimId} for review.`,
          claimId
        );
      }
    }

    this.processClaimWithAI(claimId, claim);
    this.logger.log(`[Claim ${claimId}] AI processing triggered.`);

    return { ...claim, status: ClaimStatus.SUBMITTED };
  }

  async uploadDocuments(claimId: string, userId: string, files: Express.Multer.File[]) {
    const claim = await this.findOne(claimId, userId);
    const supabase = this.supabaseService.getAdminClient();

    const bucket = 'Claims-Documents';

    const uploadPromises = files.map(async (file) => {
      const fileName = `${claimId}/documents/${Date.now()}_${file.originalname}`;
      
      await this.supabaseService.uploadFile(
        bucket, 
        fileName, 
        file.buffer, 
        {
          contentType: file.mimetype,
          upsert: false
        }
      );

      return this.supabaseService.getPublicUrl(bucket, fileName);
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    
    const { data, error } = await supabase
      .from('claims')
      .update({
        document_urls: [...(claim.document_urls || []), ...uploadedUrls],
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating claim with documents:', error);
      throw error;
    }

    return uploadedUrls;
  }

  async uploadDamagePhotos(claimId: string, userId: string, files: Express.Multer.File[]) {
    const claim = await this.findOne(claimId, userId);
    const supabase = this.supabaseService.getAdminClient();

    const bucket = 'Claims-photos';

    const uploadPromises = files.map(async (file) => {
      const fileName = `${claimId}/photos/${Date.now()}_${file.originalname}`;
      
      await this.supabaseService.uploadFile(
        bucket, 
        fileName, 
        file.buffer, 
        {
          contentType: file.mimetype,
          upsert: false
        }
      );

      return this.supabaseService.getPublicUrl(bucket, fileName);
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    
    const { data, error } = await supabase
      .from('claims')
      .update({
        damage_photo_urls: [...(claim.damage_photo_urls || []), ...uploadedUrls],
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating claim with photos:', error);
      throw error;
    }

    if (claim.status === ClaimStatus.SUBMITTED) {
      this.processClaimWithAI(claimId, { ...claim, damage_photo_urls: uploadedUrls });
    }

    return uploadedUrls;
  }

  private async processClaimWithAI(claimId: string, claimData: any) {
    try {
      this.logger.log(`[Claim ${claimId}] Starting AI processing workflow`);
      
      await this.updateClaimStatus(claimId, ClaimStatus.PROCESSING);

      this.notificationGateway.notifyAIProcessingUpdate(
        claimData.user_id,
        claimId,
        'initialization',
        10
      );

      this.logger.log(`[Claim ${claimId}] Calling AI agents service...`);
      const aiResult = await this.aiAgentsService.processClaim({
        claimId,
        claimType: claimData.type,
        requestedAmount: claimData.requested_amount,
        description: claimData.description,
        documentUrls: claimData.document_urls || [],
        damagePhotoUrls: claimData.damage_photo_urls || [],
        incidentDate: claimData.incident_date,
        location: claimData.location,
      });

      this.logger.log(`[Claim ${claimId}] AI processing completed:`, {
        confidenceScore: aiResult.confidenceScore,
        riskScore: aiResult.riskScore,
        fraudDetected: aiResult.fraudDetected,
        requiresHumanReview: aiResult.requiresHumanReview,
        recommendedAmount: aiResult.recommendedAmount,
      });

      this.notificationGateway.notifyAIProcessingUpdate(
        claimData.user_id,
        claimId,
        'ai_complete',
        90
      );

      await this.updateClaimWithAIResult(claimId, aiResult);

      const blockchainTxHash = aiResult.metadata?.tx_hash;
      
      if (blockchainTxHash) {
        this.logger.log(`[Claim ${claimId}] Blockchain recorded by AI agent: ${blockchainTxHash}`);
        
        const supabase = this.supabaseService.getAdminClient();
        await supabase
          .from('claims')
          .update({ blockchain_tx_hash: blockchainTxHash })
          .eq('id', claimId);

        this.notificationGateway.notifyBlockchainTransaction(
          claimData.user_id,
          claimId,
          blockchainTxHash
        );
      } else {
        this.logger.warn(`[Claim ${claimId}] Blockchain recording skipped or failed in AI agent`);
      }

      if (aiResult.fraudDetected) {
        this.notificationGateway.notifyFraudAlert(
          claimData.user_id,
          claimId,
          aiResult.fraudReason || 'Fraud detected by AI analysis'
        );
      }

      this.logger.log(`[Claim ${claimId}] AI processing workflow completed successfully`);

    } catch (error) {
      this.logger.error(`[Claim ${claimId}] AI processing failed:`, error.message);
      this.logger.error(`[Claim ${claimId}] Error stack:`, error.stack);
      
      await this.updateClaimStatus(claimId, ClaimStatus.HUMAN_REVIEW);
      
      this.notificationGateway.notifyClaimStatusUpdate(
        claimData.user_id,
        claimId,
        ClaimStatus.HUMAN_REVIEW,
        { reason: 'AI processing failed, requires manual review' }
      );
    }
  }

  private async updateClaimStatus(claimId: string, status: ClaimStatus) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('claims')
      .update({ status })
      .eq('id', claimId);

    if (error) {
      this.logger.error('Error updating claim status:', error);
      throw error;
    }
  }

  private async updateClaimWithAIResult(claimId: string, aiResult: any) {
    const supabase = this.supabaseService.getAdminClient();
    
    const newStatus = (aiResult.fraudDetected || aiResult.requiresHumanReview)
      ? ClaimStatus.HUMAN_REVIEW
      : ClaimStatus.AI_REVIEW;

    this.logger.log(`[Claim ${claimId}] Updating with status ${newStatus}`);

    const { data: currentClaim, error: fetchError } = await supabase
      .from('claims')
      .select('user_id, processing_steps')
      .eq('id', claimId)
      .single();

    if (fetchError) {
      this.logger.error(`[Claim ${claimId}] Error fetching current claim:`, fetchError);
    }

    const processingSteps = [
      ...(currentClaim?.processing_steps || []),
      {
        step: 'ai_processing_complete',
        completed_at: new Date().toISOString(),
        details: `AI assessment completed with ${aiResult.confidenceScore}% confidence`,
      }
    ];

    this.logger.log(`[Claim ${claimId}] Preparing to update with AI assessment`);

    const { data, error } = await supabase
      .from('claims')
      .update({
        status: newStatus,
        ai_assessment: aiResult,
        approved_amount: aiResult.recommendedAmount,
        processing_steps: processingSteps,
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      this.logger.error(`[Claim ${claimId}] Error updating with AI result:`, error);
      throw error;
    }

    this.logger.log(`[Claim ${claimId}] Successfully updated. Status: ${data.status}`);
    
    if (currentClaim?.user_id) {
      this.notificationGateway.notifyClaimStatusUpdate(
        currentClaim.user_id,
        claimId,
        newStatus,
        { aiAssessment: aiResult }
      );
    }
  }

  async approveClaim(claimId: string, approvedAmount: number) {
    this.logger.log(`[Claim ${claimId}] Approval requested with amount: ${approvedAmount}`);
    
    const claim = await this.findOne(claimId);
    
    const validStatuses = [ClaimStatus.AI_REVIEW, ClaimStatus.HUMAN_REVIEW];
    if (!validStatuses.includes(claim.status as ClaimStatus)) {
      throw new BadRequestException(
        `Claim cannot be approved in current status: ${claim.status}. Valid statuses are: ${validStatuses.join(', ')}`
      );
    }

    if (approvedAmount <= 0) {
      throw new BadRequestException('Approved amount must be greater than 0');
    }

    if (approvedAmount > claim.requested_amount * 1.5) {
      throw new BadRequestException('Approved amount cannot exceed 150% of requested amount');
    }

    const supabase = this.supabaseService.getAdminClient();
    
    const processingSteps = [
      ...(claim.processing_steps || []),
      {
        step: 'admin_approved',
        completed_at: new Date().toISOString(),
        details: `Claim approved for ${approvedAmount}`,
      }
    ];

    const { data, error } = await supabase
      .from('claims')
      .update({
        status: ClaimStatus.APPROVED,
        approved_amount: approvedAmount,
        approved_at: new Date().toISOString(),
        processing_steps: processingSteps,
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      this.logger.error(`[Claim ${claimId}] Error approving claim:`, error);
      throw new BadRequestException(`Failed to approve claim: ${error.message}`);
    }

    this.logger.log(`[Claim ${claimId}] Claim approved successfully in database`);

    await this.createNotification(
      claim.user_id,
      'Claim Approved! 🎉',
      `Your claim #${claimId.substring(0,8)} has been approved for $${approvedAmount}.`,
      claimId
    );

    if (claim.blockchain_tx_hash) {
      try {
        this.logger.log(`[Claim ${claimId}] Recording approval on blockchain...`);
        const txHash = await this.blockchainService.approveClaim(claimId, approvedAmount);
        
        await supabase
          .from('claims')
          .update({ approval_tx_hash: txHash })
          .eq('id', claimId);

        this.logger.log(`[Claim ${claimId}] Blockchain approval recorded: ${txHash}`);
        
        this.notificationGateway.notifyBlockchainTransaction(
          claim.user_id,
          claimId,
          txHash
        );
      } catch (blockchainError) {
        this.logger.error(`[Claim ${claimId}] Blockchain approval failed:`, blockchainError.message);
      }
    } else {
      this.logger.warn(`[Claim ${claimId}] Skipping blockchain approval - claim was not recorded on blockchain during AI processing`);
    }

    this.notificationGateway.notifyClaimStatusUpdate(
      claim.user_id,
      claimId,
      ClaimStatus.APPROVED,
      { approvedAmount }
    );

    return data;
  }

  async rejectClaim(claimId: string, reason: string) {
    const claim = await this.findOne(claimId);
    const supabase = this.supabaseService.getAdminClient();
    
    const { data, error } = await supabase
      .from('claims')
      .update({
        status: ClaimStatus.REJECTED,
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error rejecting claim:', error);
      throw error;
    }

    // ✅ Notify user of rejection
    await this.createNotification(
      claim.user_id,
      'Claim Rejected',
      `Your claim #${claimId.substring(0,8)} was rejected. Reason: ${reason}. You can edit and resubmit.`,
      claimId
    );

    this.notificationGateway.notifyClaimStatusUpdate(
      claim.user_id,
      claimId,
      ClaimStatus.REJECTED,
      { reason }
    );

    return data;
  }

  async settleClaim(claimId: string) {
    const claim = await this.findOne(claimId);
    
    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException('Only approved claims can be settled');
    }

    const txHash = await this.blockchainService.settleClaim(
      claimId, 
      claim.approved_amount
    );

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('claims')
      .update({
        status: ClaimStatus.SETTLED,
        settlement_tx_hash: txHash,
        settled_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error settling claim:', error);
      throw error;
    }

    this.notificationGateway.notifyClaimStatusUpdate(
      claim.user_id,
      claimId,
      ClaimStatus.SETTLED,
      { settlementAmount: claim.approved_amount, txHash }
    );

    return data;
  }

  async getClaimStats(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: claims, error } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error fetching claim stats:', error);
      throw error;
    }
    
    const stats = {
      total: claims.length,
      byStatus: {
        [ClaimStatus.SUBMITTED]: 0,
        [ClaimStatus.PROCESSING]: 0,
        [ClaimStatus.AI_REVIEW]: 0,
        [ClaimStatus.HUMAN_REVIEW]: 0,
        [ClaimStatus.APPROVED]: 0,
        [ClaimStatus.REJECTED]: 0,
        [ClaimStatus.SETTLED]: 0,
      },
      byType: {
        [ClaimType.AUTO]: 0,
        [ClaimType.HOME]: 0,
        [ClaimType.HEALTH]: 0,
      },
      totalRequested: 0,
      totalApproved: 0,
      totalSettled: 0,
    };

    claims.forEach(claim => {
      stats.byStatus[claim.status]++;
      stats.byType[claim.type]++;
      stats.totalRequested += Number(claim.requested_amount) || 0; // ✅ Use Number() safely
      
      // ✅ Calculate Total Approved Value (Money the user will get)
      if (claim.approved_amount) {
        const amount = Number(claim.approved_amount) || 0;
        stats.totalApproved += amount;
        
        // ✅ If you want "Settled" to mean "Money in pocket" (Status = SETTLED)
        if (claim.status === ClaimStatus.SETTLED) {
            stats.totalSettled += amount;
        }
      }
    });

    return stats;
  }
}