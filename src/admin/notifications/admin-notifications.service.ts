import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendNotificationDto, BroadcastNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class AdminNotificationsService {
  constructor(private prisma: PrismaService) {}

  async sendToUser(dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
      },
    });
    return { message: 'Notification sent', data: notification };
  }

  async broadcast(dto: BroadcastNotificationDto) {
    const users = await this.prisma.user.findMany({
      where: { isVerified: true },
      select: { id: true },
    });

    await this.prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
      })),
    });

    return {
      message: `Broadcast sent to ${users.length} users`,
      data: { recipients: users.length },
    };
  }
}
