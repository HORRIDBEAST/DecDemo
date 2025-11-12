import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove from user mapping
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
    this.userSockets.set(data.userId, client.id);
    client.join(`user_${data.userId}`);
    this.logger.log(`User ${data.userId} joined room`);
  }

  // Notification methods
  notifyClaimStatusUpdate(userId: string, claimId: string, status: string, data?: any) {
    this.server.to(`user_${userId}`).emit('claimStatusUpdate', {
      claimId,
      status,
      data,
      timestamp: new Date(),
    });
  }

  notifyAIProcessingUpdate(userId: string, claimId: string, agentType: string, progress: number) {
    this.server.to(`user_${userId}`).emit('aiProcessingUpdate', {
      claimId,
      agentType,
      progress,
      timestamp: new Date(),
    });
  }

  notifyBlockchainTransaction(userId: string, claimId: string, txHash: string) {
    this.server.to(`user_${userId}`).emit('blockchainTransaction', {
      claimId,
      txHash,
      timestamp: new Date(),
    });
  }

  notifyFraudAlert(userId: string, claimId: string, reason: string) {
    this.server.to(`user_${userId}`).emit('fraudAlert', {
      claimId,
      reason,
      timestamp: new Date(),
    });
  }
}