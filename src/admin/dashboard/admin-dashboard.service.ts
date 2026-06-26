import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      verifiedUsers,
      suspendedUsers,
      pendingDeposits,
      pendingWithdrawals,
      totalDepositVolume,
      totalWithdrawalVolume,
      totalMiningPaid,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
      this.prisma.deposit.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      this.prisma.deposit.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.miningEarning.aggregate({ _sum: { amount: true } }),
      this.prisma.notification.count({ where: { isRead: false } }),
    ]);

    return {
      data: {
        users: { total: totalUsers, verified: verifiedUsers, suspended: suspendedUsers },
        pendingActions: { deposits: pendingDeposits, withdrawals: pendingWithdrawals },
        volumes: {
          totalDeposited: Number(totalDepositVolume._sum.amount || 0),
          totalWithdrawn: Number(totalWithdrawalVolume._sum.amount || 0),
          totalMiningPaid: Number(totalMiningPaid._sum.amount || 0),
        },
        unreadNotifications,
        currency: 'USDT',
      },
    };
  }
}
