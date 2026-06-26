import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get account stats — balance, totals, deposit/withdrawal counts' })
  @ApiResponse({
    status: 200,
    description: 'Account dashboard statistics',
    schema: {
      example: {
        data: {
          balance: 152.5,
          totalDeposited: 200,
          totalWithdrawn: 50,
          totalEarned: 2.5,
          pendingDeposits: 1,
          depositCount: 2,
          withdrawalCount: 1,
          earningCount: 5,
          currency: 'USDT',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStats(@CurrentUser() user: any) {
    return this.dashboardService.getStats(user.id);
  }
}
