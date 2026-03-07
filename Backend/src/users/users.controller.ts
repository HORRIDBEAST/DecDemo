import { Controller, Get, Body, Patch, UseGuards, Request, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {Public} from '../auth/decorators/public.decorator';
@ApiTags('users')
@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Get('notifications')
  async getNotifications(@Request() req) {
    // You'll need to add getNotifications to UsersService
    return this.usersService.getNotifications(req.user.id);
  }

  @Patch('notifications/:id/read')
  async markRead(@Param('id') id: string) {
    return this.usersService.markNotificationRead(id);
  }
  
  @Patch('me')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('reviews')
  async createReview(@Request() req, @Body() body: { rating: number; comment: string; claimId?: string }) {
    return this.usersService.createReview(req.user.id, body.rating, body.comment, body.claimId);
  }

  @Get('my-reviews')
  async getMyReviews(@Request() req) {
    return this.usersService.getUserReviews(req.user.id);
  }

  @Get('reviews/public')
  @Public() // You might need to create a Public decorator or just allow this route in AuthGuard
  async getPublicReviews() {
    const reviews = this.usersService.getPublicReviews();
    return reviews;
  }
}