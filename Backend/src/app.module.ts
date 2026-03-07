import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller'; // Add this import
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { UsersModule } from './users/users.module';
import { WebSocketModule } from './websocket/websocket.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { SupabaseModule } from './supabase/supabase.module'; // Changed from FirebaseModule
import { AiAgentsModule } from './ai-agents/ai-agents.module';
import { FinanceController } from './users/finance.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule, // Changed from FirebaseModule
    AuthModule,
    UsersModule,
    ClaimsModule,
    WebSocketModule,
    BlockchainModule,
    AiAgentsModule,
  ],
   controllers: [AppController, FinanceController], // Add this
  providers: [AppService], // Add this
})
export class AppModule {}