import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private users = new Map<number, string>(); // Store user socket connections (userId -> socketId)

  // When a client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // When a client disconnects, clean up the mapping
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.users.forEach((value, key) => {
      if (value === client.id) {
        this.users.delete(key); // Remove the user from the map
      }
    });
  }

  // When a user joins, store their socketId in the users map
  @SubscribeMessage('join')
  handleJoin(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    this.users.set(userId, client.id); // Store socket ID for the user
    console.log(`✅ User ${userId} joined with socket ID: ${client.id}`);
  }

  // Send notification to a specific user using their socketId
  sendNotification(userId: number, message: string, type: string) {
    const socketId = this.users.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('newNotification', { message, type });
      console.log(`Sent notification to user ${userId}: ${message}`);
    } else {
      console.log(`User ${userId} not connected, notification not sent`);
    }
  }
}
