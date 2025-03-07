import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum NotificationType {
  DEAL_CREATED = 'DEAL_CREATED',
  DEAL_WON = 'DEAL_WON',
  DEAL_NEGOTIATION = 'DEAL_NEGOTIATION',
}

export class SendNotificationDto {
  @IsNotEmpty()
  @IsString()
  message: string; // the notification message

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType; // type of notification (like 'DEAL_CREATED', etc.)
}
