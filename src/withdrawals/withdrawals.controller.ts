import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@ApiTags('Withdrawals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a withdrawal request — requires PIN + sufficient balance' })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal submitted and pending admin approval',
    schema: {
      example: {
        message: 'Withdrawal request submitted and pending admin approval',
        data: {
          id: 'cuid',
          userId: 'cuid',
          amount: '50',
          address: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          status: 'PENDING',
          createdAt: '2026-06-24T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Below minimum / insufficient balance / PIN not set' })
  @ApiResponse({ status: 401, description: 'Incorrect PIN or unauthorized' })
  create(@CurrentUser() user: any, @Body() dto: CreateWithdrawalDto) {
    return this.withdrawalsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get own withdrawal history (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated withdrawal list',
    schema: {
      example: {
        data: {
          withdrawals: [
            { id: 'cuid', amount: '50', address: 'TXxxx...', status: 'PENDING', createdAt: '2026-06-24T00:00:00.000Z' },
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
    return this.withdrawalsService.findAll(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single withdrawal by ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal record',
    schema: {
      example: {
        data: { id: 'cuid', amount: '50', address: 'TXxxx...', status: 'PENDING', createdAt: '2026-06-24T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your withdrawal' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.withdrawalsService.findOne(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending withdrawal' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal cancelled',
    schema: { example: { message: 'Withdrawal cancelled' } },
  })
  @ApiResponse({ status: 400, description: 'Only pending withdrawals can be cancelled' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your withdrawal' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.withdrawalsService.cancel(user.id, id);
  }
}
