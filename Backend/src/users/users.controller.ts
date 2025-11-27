import { Controller, Get, Body, Patch, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags } from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

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
}