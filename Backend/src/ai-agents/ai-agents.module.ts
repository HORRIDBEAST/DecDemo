import { Module } from '@nestjs/common';
import { AiAgentsService } from './ai-agents.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AiAgentsService],
  exports: [AiAgentsService],
})
export class AiAgentsModule {}