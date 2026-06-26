import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MiningService } from './mining.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CalculateDto } from './dto/calculate.dto';

@ApiTags('Mining')
@Controller('mining')
export class MiningController {
  constructor(private readonly miningService: MiningService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate mining profit for a given investment (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Projected earnings returned',
    schema: {
      example: {
        data: {
          investment: 500,
          dailyRate: '0.50%',
          daily: 2.5,
          weekly: 17.5,
          monthly: 75,
          currency: 'USDT',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error — amount must be a number >= 1' })
  calculate(@Body() dto: CalculateDto) {
    return this.miningService.calculate(dto);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get current mining rates and minimum deposit (no auth required)' })
  @ApiResponse({
    status: 200,
    description: 'Current platform rates',
    schema: {
      example: {
        data: {
          dailyRate: 0.005,
          dailyRatePercent: '0.50%',
          weeklyRatePercent: '3.50%',
          monthlyRatePercent: '15.00%',
          minDeposit: 10,
          currency: 'USDT',
        },
      },
    },
  })
  getRates() {
    return this.miningService.getRates();
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own mining earnings history' })
  @ApiResponse({
    status: 200,
    description: 'Earnings history and total',
    schema: {
      example: {
        data: {
          earnings: [
            { id: 'cuid', userId: 'cuid', amount: '2.5', note: 'Daily mining reward', createdAt: '2026-06-23T00:00:00.000Z' },
          ],
          totalEarned: 2.5,
          currency: 'USDT',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getEarnings(@CurrentUser() user: any) {
    return this.miningService.getEarnings(user.id);
  }
}
