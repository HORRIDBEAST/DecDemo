import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { IsString } from 'class-validator';

class LoginDto {
  @IsString()
  token: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with Supabase token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout current user' })
  @UseGuards(SupabaseAuthGuard)
  async logout(@Request() req) {
    return { message: 'Logout successful' };
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify current authentication status' })
  @UseGuards(SupabaseAuthGuard)
  async verify(@Request() req) {
    return { user: req.user, authenticated: true };
  }
}