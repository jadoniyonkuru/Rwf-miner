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
import { DepositsService } from './deposits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UploadQrDto } from './dto/upload-qr.dto';

@ApiTags('Deposits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get('address')
  @ApiOperation({ summary: 'Get the platform TRC-20 USDT deposit address' })
  @ApiResponse({
    status: 200,
    description: 'Deposit address details',
    schema: {
      example: {
        data: {
          address: 'TELEXuLxzbW6ejKTL6qKJE48UA3LQDaBo',
          network: 'TRC-20',
          currency: 'USDT',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDepositAddress() {
    return this.depositsService.getDepositAddress();
  }

  @Get('qr')
  @ApiOperation({ summary: 'Get QR code — returns custom QR if set, otherwise platform default' })
  @ApiResponse({
    status: 200,
    description: 'QR code as Base64 string',
    schema: {
      example: {
        data: {
          qr: 'data:image/png;base64,...',
          isCustom: true,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getQr(@CurrentUser() user: any) {
    return this.depositsService.getQr(user.id);
  }

  @Post('qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload a custom QR code (Base64-encoded image)' })
  @ApiResponse({
    status: 200,
    description: 'QR code saved',
    schema: { example: { message: 'QR code uploaded successfully' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid Base64 image format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  uploadQr(@CurrentUser() user: any, @Body() dto: UploadQrDto) {
    return this.depositsService.uploadQr(user.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a new deposit — provide amount and TRC-20 TxID' })
  @ApiResponse({
    status: 201,
    description: 'Deposit submitted and pending admin confirmation',
    schema: {
      example: {
        message: 'Deposit submitted and pending confirmation',
        data: {
          id: 'cuid',
          userId: 'cuid',
          amount: '100',
          txHash: 'abc123txhash...',
          status: 'PENDING',
          createdAt: '2026-06-23T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Below minimum deposit / duplicate TxID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser() user: any, @Body() dto: CreateDepositDto) {
    return this.depositsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get own deposit history (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated deposit list',
    schema: {
      example: {
        data: {
          deposits: [
            { id: 'cuid', amount: '100', txHash: 'abc123...', status: 'PENDING', createdAt: '2026-06-23T00:00:00.000Z' },
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
    return this.depositsService.findAll(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single deposit by ID' })
  @ApiParam({ name: 'id', description: 'Deposit ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Deposit record',
    schema: {
      example: {
        data: { id: 'cuid', amount: '100', txHash: 'abc123...', status: 'PENDING', createdAt: '2026-06-23T00:00:00.000Z' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your deposit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.depositsService.findOne(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending deposit' })
  @ApiParam({ name: 'id', description: 'Deposit ID (cuid)' })
  @ApiResponse({
    status: 200,
    description: 'Deposit cancelled',
    schema: { example: { message: 'Deposit cancelled' } },
  })
  @ApiResponse({ status: 400, description: 'Only pending deposits can be cancelled' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your deposit' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.depositsService.cancel(user.id, id);
  }
}
