import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateDto } from './dto/calculate.dto';

@Injectable()
export class MiningService {
  constructor(private prisma: PrismaService) {}

  async calculate(dto: CalculateDto) {
    const config = await this.prisma.platformConfig.findFirst();
    const dailyRate = config ? Number(config.miningDailyRate) : 0.005;

    const daily = +(dto.amount * dailyRate).toFixed(8);
    const weekly = +(daily * 7).toFixed(8);
    const monthly = +(daily * 30).toFixed(8);

    return {
      data: {
        investment: dto.amount,
        dailyRate: `${(dailyRate * 100).toFixed(2)}%`,
        daily,
        weekly,
        monthly,
        currency: 'USDT',
      },
    };
  }

  async getRates() {
    const config = await this.prisma.platformConfig.findFirst();
    const dailyRate = config ? Number(config.miningDailyRate) : 0.005;

    return {
      data: {
        dailyRate,
        dailyRatePercent: `${(dailyRate * 100).toFixed(2)}%`,
        weeklyRatePercent: `${(dailyRate * 7 * 100).toFixed(2)}%`,
        monthlyRatePercent: `${(dailyRate * 30 * 100).toFixed(2)}%`,
        minDeposit: config ? Number(config.minDeposit) : 10,
        currency: 'USDT',
      },
    };
  }

  async getEarnings(userId: string) {
    const earnings = await this.prisma.miningEarning.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const total = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      data: {
        earnings,
        totalEarned: +total.toFixed(8),
        currency: 'USDT',
      },
    };
  }
}
