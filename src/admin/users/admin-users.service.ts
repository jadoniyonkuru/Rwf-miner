import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminSetPasswordDto } from './dto/admin-set-password.dto';
import { CreditBalanceDto } from './dto/credit-balance.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    // Always exclude ADMIN accounts from the user management list
    const where: any = { role: 'USER' };
    if (search) where.email = { contains: search, mode: 'insensitive' };

    const [users, total, depositGroups, earningGroups, withdrawalGroups] = await Promise.all([
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
      // Total confirmed deposits per user
      this.prisma.deposit.groupBy({
        by: ['userId'],
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      // Total earnings per user
      this.prisma.miningEarning.groupBy({
        by: ['userId'],
        _sum: { amount: true },
      }),
      // Total withdrawn per user
      this.prisma.withdrawal.groupBy({
        by: ['userId'],
        where: { status: { in: ['PENDING', 'COMPLETED'] } },
        _sum: { amount: true },
      }),
    ]);

    // Build lookup maps
    const depositsMap = Object.fromEntries(depositGroups.map((d) => [d.userId, Number(d._sum.amount || 0)]));
    const earningsMap = Object.fromEntries(earningGroups.map((e) => [e.userId, Number(e._sum.amount || 0)]));
    const withdrawalsMap = Object.fromEntries(withdrawalGroups.map((w) => [w.userId, Number(w._sum.amount || 0)]));

    const enriched = users.map((u) => ({
      ...u,
      totalDeposited: +(depositsMap[u.id] ?? 0).toFixed(2),
      totalEarned: +(earningsMap[u.id] ?? 0).toFixed(2),
      balance: +Math.max(0, (earningsMap[u.id] ?? 0) - (withdrawalsMap[u.id] ?? 0)).toFixed(2),
    }));

    return { data: { users: enriched, total, page, limit } };
  }

  async createUser(dto: AdminCreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const hashed = await bcrypt.hash(dto.password, 10);
    const referralCode = uuidv4().slice(0, 8).toUpperCase();
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hashed, isVerified: dto.isVerified ?? true, referralCode },
      select: { id: true, email: true, role: true, isVerified: true, isSuspended: true, createdAt: true },
    });
    try {
      await this.mailService.sendAdminCreatedAccountEmail(dto.email, dto.password);
    } catch { /* non-fatal */ }
    return { message: 'User created', data: user };
  }

  async setPassword(id: string, dto: AdminSetPasswordDto) {
    await this.findOne(id);
    const hashed = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashed } });
    return { message: 'Password updated' };
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
    const { data: user } = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isSuspended: true } }),
      // Revoke all refresh tokens so existing sessions cannot be renewed
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
      this.prisma.notification.create({
        data: {
          userId: id,
          title: 'Account Suspended',
          message: 'Your account has been suspended by an administrator. Please contact support for assistance.',
          type: 'ERROR',
        },
      }),
    ]);
    try {
      await this.mailService.sendAccountSuspendedEmail(user.email);
    } catch { /* non-fatal */ }
    return { message: 'User suspended' };
  }

  async activate(id: string) {
    const { data: user } = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isSuspended: false } }),
      this.prisma.notification.create({
        data: {
          userId: id,
          title: 'Account Activated',
          message: 'Your account has been reactivated. You can now log in and access all features.',
          type: 'SUCCESS',
        },
      }),
    ]);
    try {
      await this.mailService.sendAccountActivatedEmail(user.email);
    } catch { /* non-fatal */ }
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
