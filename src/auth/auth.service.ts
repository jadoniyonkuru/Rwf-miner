import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupPinDto } from './dto/setup-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { ResetPinDto } from './dto/reset-pin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}${'•'.repeat(3)}@${domain}`;
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  // ── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    let referrerId: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) referrerId = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    let referralCode = this.generateReferralCode();
    while (await this.prisma.user.findUnique({ where: { referralCode } })) {
      referralCode = this.generateReferralCode();
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        emailVerifyToken: otp,
        emailVerifyExpiry: expiry,
        referralCode,
        ...(referrerId && { referrerId }),
      },
    });

    try {
      await this.mailService.sendVerificationEmail(user.email, otp);
    } catch {
      // Email failed but user is created — they can use resend-verification
    }

    const testMode = process.env.TESTING_MODE === 'true';

    return {
      message: 'Registration successful. Check your email for the verification code.',
      data: {
        email: this.maskEmail(user.email),
        ...(testMode && { verificationCode: otp }),
      },
    };
  }

  // ── Verify Email ──────────────────────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Email already verified');
    if (
      user.emailVerifyToken !== dto.code ||
      !user.emailVerifyExpiry ||
      user.emailVerifyExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
    });

    return { message: 'Email verified successfully' };
  }

  // ── Resend Verification ───────────────────────────────────────────────────

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isVerified) throw new BadRequestException('Email already verified');

    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: otp, emailVerifyExpiry: expiry },
    });

    try {
      await this.mailService.sendVerificationEmail(email, otp);
    } catch {
      // Email failed — OTP is in DB, user can retry
    }

    const testMode = process.env.TESTING_MODE === 'true';

    return {
      message: 'Verification code resent',
      ...(testMode && { verificationCode: otp }),
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new UnauthorizedException('Please verify your email first');
    if (user.isSuspended) throw new UnauthorizedException('Account suspended');

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      message: 'Login successful',
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: this.maskEmail(user.email),
          role: user.role,
          isPinSet: user.isPinSet,
        },
      },
    };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    return { message: 'Logged out successfully' };
  }

  // ── Refresh Token ─────────────────────────────────────────────────────────

  async refreshToken(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const tokens = await this.issueTokens(stored.user.id, stored.user.email);
    return { message: 'Token refreshed', data: tokens };
  }

  // ── Forgot Password ───────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    try {
      await this.mailService.sendPasswordResetEmail(email, token);
    } catch {
      // Email failed — token is in DB
    }

    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ── Reset Password ────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: dto.token },
    });

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  // ── Change Password ───────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Password changed successfully' };
  }

  // ── Setup PIN ─────────────────────────────────────────────────────────────

  async setupPin(userId: string, dto: SetupPinDto) {
    if (dto.pin !== dto.confirmPin) {
      throw new BadRequestException('PINs do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user.isPinSet) throw new BadRequestException('PIN already set. Use change PIN instead');

    const hashedPin = await bcrypt.hash(dto.pin, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin, isPinSet: true },
    });

    return { message: 'Withdrawal PIN set successfully' };
  }

  // ── Verify PIN ────────────────────────────────────────────────────────────

  async verifyPin(userId: string, dto: VerifyPinDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user.isPinSet) throw new BadRequestException('PIN not set up yet');

    const match = await bcrypt.compare(dto.pin, user.pin);
    if (!match) throw new UnauthorizedException('Incorrect PIN');

    return { message: 'PIN verified', data: { verified: true } };
  }

  // ── Change PIN ────────────────────────────────────────────────────────────

  async changePin(userId: string, dto: ChangePinDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user.isPinSet) throw new BadRequestException('PIN not set up yet');

    const match = await bcrypt.compare(dto.currentPin, user.pin);
    if (!match) throw new UnauthorizedException('Current PIN is incorrect');

    const hashed = await bcrypt.hash(dto.newPin, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { pin: hashed } });

    return { message: 'PIN changed successfully' };
  }

  // ── Reset PIN (via email) ─────────────────────────────────────────────────

  async requestPinReset(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { pinResetToken: token, pinResetExpiry: expiry },
    });

    try {
      await this.mailService.sendPinResetEmail(user.email, token);
    } catch {
      // Email failed — token is in DB
    }

    return { message: 'PIN reset link sent to your email' };
  }

  async resetPin(dto: ResetPinDto) {
    const user = await this.prisma.user.findFirst({
      where: { pinResetToken: dto.token },
    });

    if (!user || !user.pinResetExpiry || user.pinResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(dto.newPin, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { pin: hashed, isPinSet: true, pinResetToken: null, pinResetExpiry: null },
    });

    return { message: 'PIN reset successfully' };
  }
}
