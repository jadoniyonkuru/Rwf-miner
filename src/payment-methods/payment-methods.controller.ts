import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get active payment methods — filter by ?for=deposit or ?for=withdrawal' })
  @ApiQuery({ name: 'for', required: false, enum: ['deposit', 'withdrawal'] })
  findAll(@Query('for') forType?: 'deposit' | 'withdrawal') {
    return this.paymentMethodsService.findAllActive(forType);
  }
}
