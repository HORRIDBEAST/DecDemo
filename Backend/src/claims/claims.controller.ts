import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ClaimsService } from './claims.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { Multer } from 'multer';

@ApiTags('claims')
@ApiBearerAuth()
@Controller('claims')
@UseGuards(SupabaseAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

 @Post()
  @ApiOperation({ summary: 'Create a new claim draft' }) // <-- Updated summary
  async create(@Request() req, @Body() createClaimDto: CreateClaimDto) {
    return this.claimsService.create(req.user.id, createClaimDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all claims for current user' })
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.claimsService.findAll(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get claim statistics for current user' })
  async getStats(@Request() req) {
    return this.claimsService.getClaimStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific claim' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.claimsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a claim' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateClaimDto: UpdateClaimDto,
  ) {
    return this.claimsService.update(id, req.user.id, updateClaimDto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft claim for AI processing' })
  async submitClaim(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.claimsService.submitForProcessing(id, req.user.id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload documents for a draft claim' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('documents', 10))
  async uploadDocuments(
    @Param('id') id: string,
    @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate file types
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.mimetype));
    
    if (invalidFiles.length > 0) {
      throw new BadRequestException('Invalid file type. Only PDF and images are allowed');
    }

    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      throw new BadRequestException('File size too large. Maximum 10MB per file');
    }

    return this.claimsService.uploadDocuments(id, req.user.id, files);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Upload damage photos for a draft claim' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('photos', 20))
  async uploadDamagePhotos(
    @Param('id') id: string,
    @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate file types (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.mimetype));
    
    if (invalidFiles.length > 0) {
      throw new BadRequestException('Invalid file type. Only images are allowed');
    }

    // Validate file sizes (5MB max for photos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      throw new BadRequestException('File size too large. Maximum 5MB per photo');
    }

    return this.claimsService.uploadDamagePhotos(id, req.user.id, files);
  }

  // Admin endpoints (would be protected with admin guard in real app)
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a claim (Admin only)' })
  async approve(
    @Param('id') id: string,
    @Body('approvedAmount') approvedAmount: number,
  ) {
    return this.claimsService.approveClaim(id, approvedAmount);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a claim (Admin only)' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.claimsService.rejectClaim(id, reason);
  }

  @Post(':id/settle')
  @ApiOperation({ summary: 'Settle an approved claim (Admin only)' })
  async settle(@Param('id') id: string) {
    return this.claimsService.settleClaim(id);
  }
}