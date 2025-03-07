import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private notificationGateway: NotificationGateway) {}

  async sendNotification(userId: number, message: string, type: string) {
    return this.notificationGateway.sendNotification(userId, message, type);
  }
}
