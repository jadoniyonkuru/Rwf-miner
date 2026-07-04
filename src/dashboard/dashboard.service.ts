import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(userId: string) {
    const [deposits, withdrawals, earnings, pendingDeposits, pendingWithdrawals] = await Promise.all([
      this.prisma.deposit.aggregate({
        where: { userId, status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.withdrawal.aggregate({
        where: { userId, status: { in: ['PENDING', 'COMPLETED'] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.miningEarning.aggregate({
        where: { userId },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.deposit.count({ where: { userId, status: 'PENDING' } }),
      this.prisma.withdrawal.aggregate({
        where: { userId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalDeposited = Number(deposits._sum.amount || 0);
    const totalWithdrawn = Number(withdrawals._sum.amount || 0);
    const totalEarned = Number(earnings._sum.amount || 0);
    const pendingWithdrawalAmount = Number(pendingWithdrawals._sum.amount || 0);
    // balance = withdrawable earnings minus all withdrawals (pending + completed)
    const balance = +Math.max(0, totalEarned - totalWithdrawn).toFixed(8);

    return {
      data: {
        balance,
        totalDeposited,
        totalWithdrawn,
        totalEarned,
        pendingDeposits,
        pendingWithdrawalAmount,
        pendingWithdrawalCount: pendingWithdrawals._count,
        depositCount: deposits._count,
        withdrawalCount: withdrawals._count,
        earningCount: earnings._count,
        currency: 'USDT',
      },
    };
  }
}
