import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('deposits')
  @ApiOperation({ summary: 'Deposit volume and status analytics' })
  getDepositAnalytics() {
    return this.analyticsService.getDepositAnalytics();
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Withdrawal volume and status analytics' })
  getWithdrawalAnalytics() {
    return this.analyticsService.getWithdrawalAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'User growth and status analytics' })
  getUserAnalytics() {
    return this.analyticsService.getUserAnalytics();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Platform revenue and net balance analytics' })
  getRevenueAnalytics() {
    return this.analyticsService.getRevenueAnalytics();
  }
}
