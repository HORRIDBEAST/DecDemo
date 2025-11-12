import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { AiAgentsModule } from '../ai-agents/ai-agents.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [AiAgentsModule, BlockchainModule, WebSocketModule],
  controllers: [ClaimsController],
  providers: [ClaimsService],
  exports: [ClaimsService],
})
export class ClaimsModule {}