import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}${'•'.repeat(3)}@${domain}`;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isPinSet: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      data: { ...user, email: this.maskEmail(user.email) },
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }

      const otp = this.generateOtp();
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: dto.email,
          isVerified: false,
          emailVerifyToken: otp,
          emailVerifyExpiry: expiry,
        },
      });

      await this.mailService.sendEmailChangedNotification(dto.email, otp);

      return {
        message: 'Email updated. Please verify your new email address.',
        data: { email: this.maskEmail(dto.email) },
      };
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, email: true, role: true },
    });

    return { message: 'Profile updated', data: { ...user, email: this.maskEmail(user.email) } };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted successfully' };
  }

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { data: { walletAddress: user.walletAddress ?? null } };
  }

  async updateWallet(userId: string, walletAddress: string) {
    if (!walletAddress || !/^T[A-Za-z0-9]{33}$/.test(walletAddress)) {
      throw new BadRequestException('Invalid TRC-20 wallet address');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { walletAddress } });
    return { message: 'Wallet address saved', data: { walletAddress } };
  }

  async getPaymentAddresses(userId: string) {
    const addresses = await this.prisma.userWalletAddress.findMany({
      where: { userId },
      include: {
        paymentMethod: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { data: addresses };
  }

  async savePaymentAddress(userId: string, paymentMethodId: string, address: string, label?: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (!address?.trim()) throw new BadRequestException('Address is required');

    const result = await this.prisma.userWalletAddress.upsert({
      where: { userId_paymentMethodId: { userId, paymentMethodId } },
      create: { userId, paymentMethodId, address: address.trim(), label: label?.trim() || null },
      update: { address: address.trim(), label: label?.trim() || null },
      include: { paymentMethod: { select: { id: true, name: true, type: true } } },
    });
    return { message: 'Address saved', data: result };
  }

  async deletePaymentAddress(userId: string, id: string) {
    const addr = await this.prisma.userWalletAddress.findUnique({ where: { id } });
    if (!addr || addr.userId !== userId) throw new NotFoundException('Address not found');
    await this.prisma.userWalletAddress.delete({ where: { id } });
    return { message: 'Address removed' };
  }

  async getReferral(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referrals: { select: { id: true, createdAt: true, isVerified: true } },
        referrer: { select: { referralCode: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const frontendUrl = process.env.FRONTEND_URL || 'https://rwf-miner-ui.vercel.app';

    return {
      data: {
        referralCode: user.referralCode ?? null,
        referralLink: user.referralCode ? `${frontendUrl}/register?ref=${user.referralCode}` : null,
        totalReferrals: user.referrals.length,
        verifiedReferrals: user.referrals.filter(r => r.isVerified).length,
        referredBy: user.referrer?.referralCode ?? null,
      },
    };
  }
}
