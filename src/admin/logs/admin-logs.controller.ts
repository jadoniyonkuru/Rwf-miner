import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditService } from '../../audit/audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Logs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/logs')
export class AdminLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get security audit logs (login, password changes, withdrawals, etc.)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Paginated audit logs',
    schema: {
      example: {
        data: {
          logs: [
            {
              id: 'cuid',
              userId: 'cuid',
              userEmail: 'user@example.com',
              action: 'login',
              ip: '197.243.x.x',
              status: 'success',
              meta: null,
              createdAt: '2026-06-30T00:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 50,
        },
      },
    },
  })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.auditService.findAll(page, limit);
  }
}
