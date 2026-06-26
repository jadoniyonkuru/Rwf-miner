import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminDepositsService } from './admin-deposits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateDepositStatusDto } from './dto/update-deposit-status.dto';
import { BulkApproveDto } from './dto/bulk-approve.dto';

@ApiTags('Admin - Deposits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/deposits')
export class AdminDepositsController {
  constructor(private readonly adminDepositsService: AdminDepositsService) {}

  @Get()
  @ApiOperation({ summary: 'List all deposits with optional status filter and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'CONFIRMED', 'REJECTED'] })
  @ApiResponse({
    status: 200,
    description: 'Paginated deposit list including user email',
    schema: {
      example: {
        data: {
          deposits: [
            { id: 'cuid', amount: '100', txHash: 'abc123...', status: 'PENDING', user: { email: 'user@example.com' }, createdAt: '2026-06-26T00:00:00.000Z' },
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
    return this.adminDepositsService.findAll(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full detail of a single deposit' })
  @ApiParam({ name: 'id', description: 'Deposit ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Deposit with user info',
    schema: {
      example: {
        data: { id: 'cuid', amount: '100', txHash: 'abc123...', status: 'PENDING', notes: null, user: { id: 'cuid', email: 'user@example.com' }, createdAt: '2026-06-26T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  findOne(@Param('id') id: string) {
    return this.adminDepositsService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Approve (CONFIRMED) or reject a deposit — notifies user' })
  @ApiParam({ name: 'id', description: 'Deposit ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Deposit status updated. User receives a notification.',
    schema: { example: { message: 'Deposit confirmed successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Deposit is not PENDING' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDepositStatusDto) {
    return this.adminDepositsService.updateStatus(id, dto);
  }

  @Post('bulk-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve multiple pending deposits at once' })
  @ApiResponse({
    status: 200,
    description: 'Bulk approve result',
    schema: { example: { message: 'Bulk approved: 3 succeeded, 0 failed' } },
  })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  bulkApprove(@Body() dto: BulkApproveDto) {
    return this.adminDepositsService.bulkApprove(dto);
  }
}
