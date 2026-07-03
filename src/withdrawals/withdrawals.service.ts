import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class WithdrawalsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async getBalance(userId: string): Promise<number> {
    const [withdrawals, earnings] = await Promise.all([
      // Deduct both PENDING and COMPLETED to prevent double-spending
      this.prisma.withdrawal.aggregate({
        where: { userId, status: { in: ['PENDING', 'COMPLETED'] } },
        _sum: { amount: true },
      }),
      this.prisma.miningEarning.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

    // Only earnings are withdrawable; deposited principal is locked
    const totalEarned = Number(earnings._sum.amount || 0);
    const totalOut = Number(withdrawals._sum.amount || 0);
    return +Math.max(0, totalEarned - totalOut).toFixed(8);
  }

  async create(userId: string, dto: CreateWithdrawalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user.isPinSet) {
      throw new BadRequestException('Please set up your withdrawal PIN first');
    }

    const pinMatch = await bcrypt.compare(dto.pin, user.pin);
    if (!pinMatch) throw new UnauthorizedException('Incorrect withdrawal PIN');

    const config = await this.prisma.platformConfig.findFirst();
    const minWithdrawal = config ? Number(config.minWithdrawal) : 10;

    if (dto.amount < minWithdrawal) {
      throw new BadRequestException(`Minimum withdrawal is ${minWithdrawal} USDT`);
    }

    // Use a transaction so balance check + withdrawal creation are atomic.
    // Prevents race condition where two simultaneous requests both pass the balance check.
    const withdrawal = await this.prisma.$transaction(async (tx) => {
      const [withdrawals, earnings] = await Promise.all([
        tx.withdrawal.aggregate({
          where: { userId, status: { in: ['PENDING', 'COMPLETED'] } },
          _sum: { amount: true },
        }),
        tx.miningEarning.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
      ]);
      const balance = +Math.max(0, Number(earnings._sum.amount || 0) - Number(withdrawals._sum.amount || 0)).toFixed(8);

      if (dto.amount > balance) {
        throw new BadRequestException(`Insufficient balance. Available: ${balance} USDT`);
      }

      return tx.withdrawal.create({
        data: { userId, amount: dto.amount, address: dto.address, status: 'PENDING' },
      });
    });

    await this.auditService.log({
      userId,
      userEmail: user.email,
      action: 'withdrawal',
      status: 'success',
      meta: { amount: dto.amount, address: dto.address },
    });

    return { message: 'Withdrawal request submitted and pending admin approval', data: withdrawal };
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where: { userId } }),
    ]);

    return { data: { withdrawals, total, page, limit } };
  }

  async findOne(userId: string, id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.userId !== userId) throw new ForbiddenException();
    return { data: withdrawal };
  }

  async cancel(userId: string, id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.userId !== userId) throw new ForbiddenException();
    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Only pending withdrawals can be cancelled');
    }

    await this.prisma.withdrawal.delete({ where: { id } });
    return { message: 'Withdrawal cancelled' };
  }
}
