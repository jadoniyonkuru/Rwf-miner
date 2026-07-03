import {
  Controller,
  Get,
  Put,
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
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminSetPasswordDto } from './dto/admin-set-password.dto';
import { CreditBalanceDto } from './dto/credit-balance.dto';

@ApiTags('Admin - Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users with optional search and pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email' })
  @ApiResponse({
    status: 200,
    description: 'Paginated user list',
    schema: {
      example: {
        data: {
          users: [{ id: 'cuid', email: 'user@example.com', role: 'USER', isVerified: true, isSuspended: false, isPinSet: true, createdAt: '2026-06-25T00:00:00.000Z' }],
          total: 1, page: 1, limit: 20,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.findAll(page, limit, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full profile of a single user including activity counts' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'User profile with counts',
    schema: {
      example: {
        data: { id: 'cuid', email: 'user@example.com', role: 'USER', isVerified: true, isSuspended: false, isPinSet: true, createdAt: '2026-06-25T00:00:00.000Z', _count: { deposits: 3, withdrawals: 1, transactions: 5 } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit user — email, role, verified, suspended status' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    schema: { example: { message: 'User updated', data: { id: 'cuid', email: 'new@example.com', role: 'ADMIN', isVerified: true, isSuspended: false } } },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  update(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.adminUsersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a user and all their data' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'User deleted', schema: { example: { message: 'User deleted' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  remove(@Param('id') id: string) {
    return this.adminUsersService.remove(id);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a user account — blocks login immediately' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'User suspended', schema: { example: { message: 'User suspended' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  suspend(@Param('id') id: string) {
    return this.adminUsersService.suspend(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-activate a suspended user account' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'User activated', schema: { example: { message: 'User activated' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  activate(@Param('id') id: string) {
    return this.adminUsersService.activate(id);
  }

  @Post(':id/set-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Directly set a new password for a user (no email required)' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  setPassword(@Param('id') id: string, @Body() dto: AdminSetPasswordDto) {
    return this.adminUsersService.setPassword(id, dto);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force-send a password reset email to a user' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'Reset email sent', schema: { example: { message: 'Password reset email sent to user' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  resetPassword(@Param('id') id: string) {
    return this.adminUsersService.resetPassword(id);
  }

  @Post(':id/reset-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force-clear a user withdrawal PIN — they must set a new one' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({ status: 200, description: 'PIN cleared', schema: { example: { message: 'User PIN cleared. They must set a new PIN on next login.' } } })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  resetPin(@Param('id') id: string) {
    return this.adminUsersService.resetPin(id);
  }

  @Post(':id/credit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually credit user balance (creates a mining earning record)' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Balance credited',
    schema: {
      example: {
        message: 'Balance credited successfully',
        data: { id: 'cuid', userId: 'cuid', amount: '100', note: 'Admin manual credit', createdAt: '2026-06-25T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  creditBalance(@Param('id') id: string, @Body() dto: CreditBalanceDto) {
    return this.adminUsersService.creditBalance(id, dto);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get full transaction history for a specific user (paginated)' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Paginated transaction list',
    schema: {
      example: {
        data: { transactions: [{ id: 'cuid', type: 'DEPOSIT', amount: '100', createdAt: '2026-06-25T00:00:00.000Z' }], total: 1, page: 1, limit: 20 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getUserActivity(@Param('id') id: string, @Query('page') page?: number) {
    return this.adminUsersService.getUserActivity(id, page);
  }

  @Get(':id/deposits')
  @ApiOperation({ summary: 'Get all deposits for a specific user' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'User deposit list',
    schema: {
      example: { data: [{ id: 'cuid', amount: '200', txHash: 'abc...', status: 'CONFIRMED', createdAt: '2026-06-25T00:00:00.000Z' }] },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getUserDeposits(@Param('id') id: string) {
    return this.adminUsersService.getUserDeposits(id);
  }

  @Get(':id/withdrawals')
  @ApiOperation({ summary: 'Get all withdrawals for a specific user' })
  @ApiParam({ name: 'id', description: 'User ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'User withdrawal list',
    schema: {
      example: { data: [{ id: 'cuid', amount: '50', address: 'TXxxx...', status: 'PENDING', createdAt: '2026-06-25T00:00:00.000Z' }] },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getUserWithdrawals(@Param('id') id: string) {
    return this.adminUsersService.getUserWithdrawals(id);
  }
}
