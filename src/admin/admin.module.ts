import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';

// Controllers
import { AdminUsersController } from './users/admin-users.controller';
import { AdminDepositsController } from './deposits/admin-deposits.controller';
import { AdminWithdrawalsController } from './withdrawals/admin-withdrawals.controller';
import { AdminTransactionsController } from './transactions/admin-transactions.controller';
import { AdminMiningController } from './mining/admin-mining.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { AdminConfigController } from './config/admin-config.controller';
import { AdminNotificationsController } from './notifications/admin-notifications.controller';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';

// Services
import { AdminUsersService } from './users/admin-users.service';
import { AdminDepositsService } from './deposits/admin-deposits.service';
import { AdminWithdrawalsService } from './withdrawals/admin-withdrawals.service';
import { AdminTransactionsService } from './transactions/admin-transactions.service';
import { AdminMiningService } from './mining/admin-mining.service';
import { AnalyticsService } from './analytics/analytics.service';
import { AdminConfigService } from './config/admin-config.service';
import { AdminNotificationsService } from './notifications/admin-notifications.service';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';

@Module({
  imports: [MailModule],
  controllers: [
    AdminUsersController,
    AdminDepositsController,
    AdminWithdrawalsController,
    AdminTransactionsController,
    AdminMiningController,
    AnalyticsController,
    AdminConfigController,
    AdminNotificationsController,
    AdminDashboardController,
  ],
  providers: [
    AdminUsersService,
    AdminDepositsService,
    AdminWithdrawalsService,
    AdminTransactionsService,
    AdminMiningService,
    AnalyticsService,
    AdminConfigService,
    AdminNotificationsService,
    AdminDashboardService,
  ],
})
export class AdminModule {}
