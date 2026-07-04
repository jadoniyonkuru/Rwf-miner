import {
  Controller,
  Post,
  Put,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SetupPinDto } from './dto/setup-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { ResetPinDto } from './dto/reset-pin.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Registration & Verification ──────────────────────────────────────────

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful — OTP sent to email',
    schema: {
      example: {
        message: 'Registration successful. Check your email for the verification code.',
        data: { email: 'us•••@example.com' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress;
    return this.authService.register(dto, ip);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using the 6-digit OTP' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: { example: { message: 'Email verified successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  @ApiResponse({ status: 404, description: 'User not found' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP verification code to email' })
  @ApiResponse({
    status: 200,
    description: 'OTP resent',
    schema: { example: { message: 'Verification code resent' } },
  })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @ApiResponse({ status: 404, description: 'User not found' })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  // ── Session Management ────────────────────────────────────────────────────

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        message: 'Login successful',
        data: {
          accessToken: 'eyJhbGci...',
          refreshToken: 'uuid-v4-token',
          user: {
            id: 'cuid',
            email: 'us•••@example.com',
            role: 'USER',
            isPinSet: false,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials / email not verified / suspended' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip;
    return this.authService.login(dto, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — invalidates the refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logged out',
    schema: { example: { message: 'Logged out successfully' } },
  })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a new access token using a valid refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New tokens issued (old refresh token is rotated)',
    schema: {
      example: {
        message: 'Token refreshed',
        data: { accessToken: 'eyJhbGci...', refreshToken: 'new-uuid' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // ── Password Management ───────────────────────────────────────────────────

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link (sent to email)' })
  @ApiResponse({
    status: 200,
    description: 'Reset link sent (same response whether email exists or not)',
    schema: {
      example: { message: 'If that email exists, a reset link has been sent' },
    },
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token received in email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: { example: { message: 'Password reset successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password (must be logged in, current password required)' })
  @ApiResponse({
    status: 200,
    description: 'Password changed',
    schema: { example: { message: 'Password changed successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  // ── PIN Management ────────────────────────────────────────────────────────

  @Post('pin/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set up a 6-digit withdrawal PIN (first time only)' })
  @ApiResponse({
    status: 200,
    description: 'PIN created',
    schema: { example: { message: 'Withdrawal PIN set successfully' } },
  })
  @ApiResponse({ status: 400, description: 'PIN already set / PINs do not match' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  setupPin(@CurrentUser() user: any, @Body() dto: SetupPinDto) {
    return this.authService.setupPin(user.id, dto);
  }

  @Post('pin/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN before performing a withdrawal' })
  @ApiResponse({
    status: 200,
    description: 'PIN is correct',
    schema: { example: { message: 'PIN verified', data: { verified: true } } },
  })
  @ApiResponse({ status: 401, description: 'Incorrect PIN' })
  @ApiResponse({ status: 400, description: 'PIN not set up yet' })
  verifyPin(@CurrentUser() user: any, @Body() dto: VerifyPinDto) {
    return this.authService.verifyPin(user.id, dto);
  }

  @Put('pin/change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change PIN (current PIN required)' })
  @ApiResponse({
    status: 200,
    description: 'PIN changed',
    schema: { example: { message: 'PIN changed successfully' } },
  })
  @ApiResponse({ status: 401, description: 'Current PIN incorrect' })
  @ApiResponse({ status: 400, description: 'PIN not set up yet' })
  changePin(@CurrentUser() user: any, @Body() dto: ChangePinDto) {
    return this.authService.changePin(user.id, dto);
  }

  @Post('pin/reset-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a PIN reset link (sent to your email)' })
  @ApiResponse({
    status: 200,
    description: 'Reset link sent',
    schema: { example: { message: 'PIN reset link sent to your email' } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  requestPinReset(@CurrentUser() user: any) {
    return this.authService.requestPinReset(user.id);
  }

  @Post('pin/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset PIN using token received in email' })
  @ApiResponse({
    status: 200,
    description: 'PIN reset successfully',
    schema: { example: { message: 'PIN reset successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  resetPin(@Body() dto: ResetPinDto) {
    return this.authService.resetPin(dto);
  }
}
