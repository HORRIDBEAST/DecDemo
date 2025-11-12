    import { PartialType } from '@nestjs/mapped-types';
    import { CreateClaimDto } from './create-claim.dto';
    import { IsEnum, IsOptional } from 'class-validator';

    export enum ClaimStatus {
  DRAFT = 'draft', // <-- ADD THIS
  SUBMITTED = 'submitted',
  PROCESSING = 'processing',
  AI_REVIEW = 'ai_review',
  HUMAN_REVIEW = 'human_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
}

    export class UpdateClaimDto extends PartialType(CreateClaimDto) {
    @IsOptional()
    @IsEnum(ClaimStatus)
    status?: ClaimStatus;
    }