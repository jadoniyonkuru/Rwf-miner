import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class SendNotificationDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Deposit Confirmed' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your deposit of 100 USDT has been confirmed.' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotificationType, default: 'INFO' })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'Platform Maintenance' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'The platform will be down for maintenance at 2AM UTC.' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotificationType, default: 'INFO' })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}
