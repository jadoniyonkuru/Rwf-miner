import { Controller, Get, Put, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications with unread count' })
  @ApiResponse({
    status: 200,
    description: 'Notification list',
    schema: {
      example: {
        data: {
          notifications: [
            { id: 'cuid', title: 'Deposit Confirmed', message: 'Your deposit of 100 USDT has been confirmed.', type: 'SUCCESS', isRead: false, createdAt: '2026-06-24T00:00:00.000Z' },
          ],
          unreadCount: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: any) {
    return this.notificationsService.findAll(user.id);
  }

  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All marked as read',
    schema: { example: { message: 'All notifications marked as read' } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    schema: { example: { message: 'Notification marked as read' } },
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted',
    schema: { example: { message: 'Notification deleted' } },
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.remove(user.id, id);
  }
}
