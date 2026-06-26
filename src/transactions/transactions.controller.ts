import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Public live transaction feed — latest 20 transactions (emails masked)' })
  @ApiResponse({
    status: 200,
    description: 'Live feed of recent transactions',
    schema: {
      example: {
        data: [
          { id: 'cuid', type: 'DEPOSIT', amount: '100', currency: 'USDT', maskedEmail: 'te•••@example.com' },
          { id: 'cuid', type: 'WITHDRAWAL', amount: '50', currency: 'USDT', maskedEmail: 'jo•••@gmail.com' },
        ],
      },
    },
  })
  getLiveFeed() {
    return this.transactionsService.getLiveFeed();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get own full transaction history (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated transaction list',
    schema: {
      example: {
        data: {
          transactions: [
            { id: 'cuid', type: 'DEPOSIT', amount: '100', createdAt: '2026-06-24T00:00:00.000Z' },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transactionsService.findAll(user.id, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiParam({ name: 'id', description: 'Transaction ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Transaction record',
    schema: {
      example: {
        data: { id: 'cuid', type: 'MINING_EARNING', amount: '2.5', createdAt: '2026-06-24T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your transaction' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactionsService.findOne(user.id, id);
  }
}
