import { IsEnum, IsNumber, IsString, IsOptional, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ClaimType {
  AUTO = 'auto',
  HOME = 'home',
  HEALTH = 'health',
}

export class CreateClaimDto {
  @IsEnum(ClaimType)
  type: ClaimType;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  requestedAmount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  damagePhotoUrls?: string[];

  @IsOptional()
  @IsString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  location?: string;
}