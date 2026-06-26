import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDepositAnalytics() {
    const [total, pending, confirmed, rejected, volume] = await Promise.all([
      this.prisma.deposit.count(),
      this.prisma.deposit.count({ where: { status: 'PENDING' } }),
      this.prisma.deposit.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.deposit.count({ where: { status: 'REJECTED' } }),
      this.prisma.deposit.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      data: {
        total,
        pending,
        confirmed,
        rejected,
        totalVolume: Number(volume._sum.amount || 0),
        currency: 'USDT',
      },
    };
  }

  async getWithdrawalAnalytics() {
    const [total, pending, completed, rejected, volume] = await Promise.all([
      this.prisma.withdrawal.count(),
      this.prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawal.count({ where: { status: 'COMPLETED' } }),
      this.prisma.withdrawal.count({ where: { status: 'REJECTED' } }),
      this.prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      data: {
        total,
        pending,
        completed,
        rejected,
        totalVolume: Number(volume._sum.amount || 0),
        currency: 'USDT',
      },
    };
  }

  async getUserAnalytics() {
    const [total, verified, suspended] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { isSuspended: true } }),
    ]);

    return {
      data: {
        total,
        verified,
        unverified: total - verified,
        suspended,
        active: verified - suspended,
      },
    };
  }

  async getRevenueAnalytics() {
    const [deposits, withdrawals, miningEarnings] = await Promise.all([
      this.prisma.deposit.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.miningEarning.aggregate({ _sum: { amount: true } }),
    ]);

    const totalIn = Number(deposits._sum.amount || 0);
    const totalOut = Number(withdrawals._sum.amount || 0);
    const totalMining = Number(miningEarnings._sum.amount || 0);

    return {
      data: {
        totalDeposited: totalIn,
        totalWithdrawn: totalOut,
        totalMiningPaid: totalMining,
        netPlatformBalance: +(totalIn - totalOut - totalMining).toFixed(8),
        currency: 'USDT',
      },
    };
  }
}
