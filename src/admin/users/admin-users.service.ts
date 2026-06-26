import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CreditBalanceDto } from './dto/credit-balance.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? { email: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isSuspended: true,
          isPinSet: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: { users, total, page, limit } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isSuspended: true,
        isPinSet: true,
        createdAt: true,
        _count: { select: { deposits: true, withdrawals: true, transactions: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { data: user };
  }

  async update(id: string, dto: AdminUpdateUserDto) {
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, role: true, isVerified: true, isSuspended: true },
    });
    return { message: 'User updated', data: user };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }

  async suspend(id: string) {
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { isSuspended: true } });
    return { message: 'User suspended' };
  }

  async activate(id: string) {
    await this.findOne(id);
    await this.prisma.user.update({ where: { id }, data: { isSuspended: false } });
    return { message: 'User activated' };
  }

  async resetPassword(id: string) {
    const { data: user } = await this.findOne(id);
    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    await this.mailService.sendPasswordResetEmail(user.email, token);
    return { message: 'Password reset email sent to user' };
  }

  async resetPin(id: string) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { pin: null, isPinSet: false },
    });
    return { message: 'User PIN cleared. They must set a new PIN on next login.' };
  }

  async creditBalance(id: string, dto: CreditBalanceDto) {
    await this.findOne(id);

    const earning = await this.prisma.$transaction(async (tx) => {
      const e = await tx.miningEarning.create({
        data: {
          userId: id,
          amount: Math.abs(dto.amount),
          note: dto.note || 'Admin manual credit',
        },
      });

      await tx.transaction.create({
        data: {
          userId: id,
          type: 'MINING_EARNING',
          amount: Math.abs(dto.amount),
          miningEarningId: e.id,
        },
      });

      return e;
    });

    return { message: 'Balance credited successfully', data: earning };
  }

  async getUserActivity(id: string, page = 1, limit = 20) {
    await this.findOne(id);
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId: id } }),
    ]);

    return { data: { transactions, total, page, limit } };
  }

  async getUserDeposits(id: string) {
    await this.findOne(id);
    const deposits = await this.prisma.deposit.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { data: deposits };
  }

  async getUserWithdrawals(id: string) {
    await this.findOne(id);
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { data: withdrawals };
  }
}
