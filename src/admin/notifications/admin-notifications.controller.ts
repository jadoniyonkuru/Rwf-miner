import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminNotificationsService } from './admin-notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SendNotificationDto, BroadcastNotificationDto } from './dto/send-notification.dto';

@ApiTags('Admin - Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification to a specific user' })
  sendToUser(@Body() dto: SendNotificationDto) {
    return this.adminNotificationsService.sendToUser(dto);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast a notification to all verified users' })
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.adminNotificationsService.broadcast(dto);
  }
}
