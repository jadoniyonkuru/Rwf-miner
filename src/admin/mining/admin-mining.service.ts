import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreditMiningDto } from './dto/credit-mining.dto';

@Injectable()
export class AdminMiningService {
  constructor(private prisma: PrismaService) {}

  async creditEarnings(dto: CreditMiningDto) {
    if (dto.userId) {
      // Credit a single user
      await this.prisma.$transaction(async (tx) => {
        const earning = await tx.miningEarning.create({
          data: {
            userId: dto.userId,
            amount: dto.amount,
            note: dto.note || 'Oracle mining credit',
          },
        });

        await tx.transaction.create({
          data: {
            userId: dto.userId,
            type: 'MINING_EARNING',
            amount: dto.amount,
            miningEarningId: earning.id,
          },
        });
      });

      return { message: `Credited ${dto.amount} USDT to user ${dto.userId}` };
    }

    // Credit all verified, non-suspended users
    const users = await this.prisma.user.findMany({
      where: { isVerified: true, isSuspended: false },
      select: { id: true },
    });

    await Promise.all(
      users.map((user) =>
        this.prisma.$transaction(async (tx) => {
          const earning = await tx.miningEarning.create({
            data: {
              userId: user.id,
              amount: dto.amount,
              note: dto.note || 'Daily mining reward',
            },
          });
          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'MINING_EARNING',
              amount: dto.amount,
              miningEarningId: earning.id,
            },
          });
        }),
      ),
    );

    return {
      message: `Credited ${dto.amount} USDT to ${users.length} users`,
      data: { usersCredited: users.length },
    };
  }

  async getSummary() {
    const [totalEarnings, totalDeposits, totalWithdrawals, activeUsers] = await Promise.all([
      this.prisma.miningEarning.aggregate({ _sum: { amount: true }, _count: true }),
      this.prisma.deposit.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.user.count({ where: { isVerified: true, isSuspended: false } }),
    ]);

    return {
      data: {
        totalMiningEarnings: Number(totalEarnings._sum.amount || 0),
        totalEarningEvents: totalEarnings._count,
        totalDeposited: Number(totalDeposits._sum.amount || 0),
        totalWithdrawn: Number(totalWithdrawals._sum.amount || 0),
        activeUsers,
        currency: 'USDT',
      },
    };
  }
}
