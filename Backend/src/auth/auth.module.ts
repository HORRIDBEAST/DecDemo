import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module'; // <-- CRITICAL FIX: Import UsersModule

@Module({
  // <-- CRITICAL FIX: Add UsersModule to imports so UsersService can be injected.
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}