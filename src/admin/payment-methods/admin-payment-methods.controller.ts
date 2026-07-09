import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPaymentMethodsService } from './admin-payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Payment Methods')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/payment-methods')
export class AdminPaymentMethodsController {
  constructor(private readonly service: AdminPaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payment methods' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a payment method' })
  create(@Body() dto: CreatePaymentMethodDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  update(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle payment method active/inactive' })
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }

  @Patch(':id/toggle-deposit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle whether this method is available for deposits' })
  toggleDeposit(@Param('id') id: string) {
    return this.service.toggleDeposit(id);
  }

  @Patch(':id/toggle-withdrawal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle whether this method is available for withdrawals' })
  toggleWithdrawal(@Param('id') id: string) {
    return this.service.toggleWithdrawal(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a payment method' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
