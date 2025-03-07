import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from 'src/dto/notification.dto';
import { JwtGuard } from 'src/guards';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationService: NotificationsService) {}

  @UseGuards(JwtGuard)
  @Post()
  createLead(@Body() dto: SendNotificationDto, @Request() req) {
    const { message, type } = dto;
    return this.notificationService.sendNotification(
      req.user.id,
      message,
      type,
    );
  }
}
