import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MiningCron {
  private readonly logger = new Logger(MiningCron.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async creditDailyEarnings() {
    await this.runCredit();
  }

  async runCredit(): Promise<{ credited: number; skipped: number; total: number }> {
    this.logger.log('Mining cron started — crediting daily earnings');

    const config = await this.prisma.platformConfig.findFirst();
    const dailyRate = config ? Number(config.miningDailyRate) : 0.005;

    // Only regular users (not admins) who are verified and active
    const users = await this.prisma.user.findMany({
      where: { isVerified: true, isSuspended: false, role: 'USER' },
      select: { id: true },
    });

    let credited = 0;
    let skipped = 0;

    for (const user of users) {
      // Earn on confirmed deposited principal only (not compounded on previous earnings)
      const deposits = await this.prisma.deposit.aggregate({
        where: { userId: user.id, status: 'CONFIRMED' },
        _sum: { amount: true },
      });

      const principal = Number(deposits._sum.amount || 0);
      if (principal <= 0) { skipped++; continue; }

      const earnAmount = +(principal * dailyRate).toFixed(8);

      await this.prisma.$transaction(async (tx) => {
        const earning = await tx.miningEarning.create({
          data: { userId: user.id, amount: earnAmount, note: 'Daily mining reward' },
        });
        await tx.transaction.create({
          data: { userId: user.id, type: 'MINING_EARNING', amount: earnAmount, miningEarningId: earning.id },
        });
        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Daily Earnings Credited',
            message: `${earnAmount.toFixed(4)} USDT has been credited to your earnings (${(dailyRate * 100).toFixed(2)}% daily rate on your deposit).`,
            type: 'SUCCESS',
          },
        });
      });

      credited++;
    }

    this.logger.log(`Mining cron complete — credited ${credited}, skipped ${skipped}/${users.length} users at ${dailyRate * 100}%`);
    return { credited, skipped, total: users.length };
  }
}
