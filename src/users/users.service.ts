import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
