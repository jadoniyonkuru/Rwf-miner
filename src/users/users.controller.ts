import { Controller, Get, Put, Delete, Body, UseGuards, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get your profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile returned (email is masked)',
    schema: {
      example: {
        data: {
          id: 'cuid',
          email: 'te•••@example.com',
          role: 'USER',
          isVerified: true,
          isPinSet: false,
          createdAt: '2026-06-22T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid token' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update your profile (email only for now)' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    schema: {
      example: {
        message: 'Profile updated',
        data: { id: 'cuid', email: 'new@example.com', role: 'USER' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete your account' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted',
    schema: { example: { message: 'Account deleted successfully' } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }

  @Get('me/wallet')
  @ApiOperation({ summary: 'Get saved TRC-20 wallet address' })
  @ApiResponse({
    status: 200,
    schema: { example: { data: { walletAddress: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' } } },
  })
  getWallet(@CurrentUser() user: any) {
    return this.usersService.getWallet(user.id);
  }

  @Put('me/wallet')
  @ApiOperation({ summary: 'Save or update TRC-20 wallet address' })
  @ApiResponse({
    status: 200,
    schema: { example: { message: 'Wallet address saved', data: { walletAddress: 'TXxxx...' } } },
  })
  updateWallet(@CurrentUser() user: any, @Body('walletAddress') walletAddress: string) {
    return this.usersService.updateWallet(user.id, walletAddress);
  }

  @Get('me/referral')
  @ApiOperation({ summary: 'Get your referral code, link, and referral stats' })
  @ApiResponse({
    status: 200,
    description: 'Referral info',
    schema: {
      example: {
        data: {
          referralCode: 'KANA6992',
          referralLink: 'https://rwf-miner-ui.vercel.app/register?ref=KANA6992',
          totalReferrals: 3,
          verifiedReferrals: 2,
          referredBy: null,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getReferral(@CurrentUser() user: any) {
    return this.usersService.getReferral(user.id);
  }
}
