import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminWithdrawalsService } from './admin-withdrawals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { BulkApproveWithdrawalsDto } from './dto/bulk-approve-withdrawals.dto';

@ApiTags('Admin - Withdrawals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/withdrawals')
export class AdminWithdrawalsController {
  constructor(private readonly adminWithdrawalsService: AdminWithdrawalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all withdrawals with optional status filter and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'COMPLETED', 'REJECTED'] })
  @ApiResponse({
    status: 200,
    description: 'Paginated withdrawal list including user email',
    schema: {
      example: {
        data: {
          withdrawals: [
            { id: 'cuid', amount: '50', address: 'TXxxx...', status: 'PENDING', user: { email: 'user@example.com' }, createdAt: '2026-06-26T00:00:00.000Z' },
          ],
          total: 1, page: 1, limit: 20,
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminWithdrawalsService.findAll(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full detail of a single withdrawal' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal with user info',
    schema: {
      example: {
        data: { id: 'cuid', amount: '50', address: 'TXxxx...', status: 'PENDING', notes: null, user: { id: 'cuid', email: 'user@example.com' }, createdAt: '2026-06-26T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  findOne(@Param('id') id: string) {
    return this.adminWithdrawalsService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Complete or reject a withdrawal — creates transaction record and notifies user' })
  @ApiParam({ name: 'id', description: 'Withdrawal ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal status updated. Transaction record created on COMPLETED. User notified.',
    schema: { example: { message: 'Withdrawal completed successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Withdrawal is not PENDING' })
  @ApiResponse({ status: 404, description: 'Withdrawal not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateWithdrawalStatusDto) {
    return this.adminWithdrawalsService.updateStatus(id, dto);
  }

  @Post('bulk-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve multiple pending withdrawals at once' })
  @ApiResponse({
    status: 200,
    description: 'Bulk approve result',
    schema: { example: { message: 'Bulk approved: 2 succeeded, 0 failed' } },
  })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  bulkApprove(@Body() dto: BulkApproveWithdrawalsDto) {
    return this.adminWithdrawalsService.bulkApprove(dto);
  }
}
