import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MiningCron {
  private readonly logger = new Logger(MiningCron.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async creditDailyEarnings() {
    this.logger.log('Mining cron started — crediting daily earnings');

    const config = await this.prisma.platformConfig.findFirst();
    const dailyRate = config ? Number(config.miningDailyRate) : 0.005;

    const users = await this.prisma.user.findMany({
      where: { isVerified: true, isSuspended: false },
      select: { id: true },
    });

    let credited = 0;

    for (const user of users) {
      const [deposits, withdrawals, earnings] = await Promise.all([
        this.prisma.deposit.aggregate({ where: { userId: user.id, status: 'CONFIRMED' }, _sum: { amount: true } }),
        this.prisma.withdrawal.aggregate({ where: { userId: user.id, status: { in: ['PENDING', 'COMPLETED'] } }, _sum: { amount: true } }),
        this.prisma.miningEarning.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
      ]);

      const balance = Number(deposits._sum.amount || 0) + Number(earnings._sum.amount || 0) - Number(withdrawals._sum.amount || 0);

      if (balance <= 0) continue;

      const earnAmount = +(balance * dailyRate).toFixed(8);

      await this.prisma.$transaction(async (tx) => {
        const earning = await tx.miningEarning.create({
          data: { userId: user.id, amount: earnAmount, note: 'Daily mining reward' },
        });
        await tx.transaction.create({
          data: { userId: user.id, type: 'MINING_EARNING', amount: earnAmount, miningEarningId: earning.id },
        });
      });

      credited++;
    }

    this.logger.log(`Mining cron complete — credited ${credited}/${users.length} users at rate ${dailyRate * 100}%`);
  }
}
