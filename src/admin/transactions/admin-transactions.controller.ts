import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminTransactionsService } from './admin-transactions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/transactions')
export class AdminTransactionsController {
  constructor(private readonly adminTransactionsService: AdminTransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform transactions (filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['DEPOSIT', 'WITHDRAWAL', 'MINING_EARNING'] })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.adminTransactionsService.findAll(page, limit, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single transaction full detail' })
  findOne(@Param('id') id: string) {
    return this.adminTransactionsService.findOne(id);
  }
}
