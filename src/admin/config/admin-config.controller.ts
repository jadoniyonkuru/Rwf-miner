import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminConfigService } from './admin-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateConfigDto } from './dto/update-config.dto';

@ApiTags('Admin - Config')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/config')
export class AdminConfigController {
  constructor(private readonly adminConfigService: AdminConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform configuration' })
  getConfig() {
    return this.adminConfigService.getConfig();
  }

  @Put()
  @ApiOperation({ summary: 'Update platform configuration (any field)' })
  updateConfig(@Body() dto: UpdateConfigDto) {
    return this.adminConfigService.updateConfig(dto);
  }

  @Get('deposit-address')
  @ApiOperation({ summary: 'Get current TRC-20 deposit address' })
  getDepositAddress() {
    return this.adminConfigService.getDepositAddress();
  }

  @Put('deposit-address')
  @ApiOperation({ summary: 'Update TRC-20 deposit address' })
  updateDepositAddress(@Body('address') address: string) {
    return this.adminConfigService.updateDepositAddress(address);
  }

  @Get('qr')
  @ApiOperation({ summary: 'Get default platform QR code' })
  getDefaultQr() {
    return this.adminConfigService.getDefaultQr();
  }

  @Put('qr')
  @ApiOperation({ summary: 'Update default platform QR code (Base64)' })
  updateDefaultQr(@Body('qr') qr: string) {
    return this.adminConfigService.updateDefaultQr(qr);
  }

  @Get('mining-rates')
  @ApiOperation({ summary: 'Get current mining rate and minimum amounts' })
  getMiningRates() {
    return this.adminConfigService.getMiningRates();
  }

  @Put('mining-rates')
  @ApiOperation({ summary: 'Update mining rate and minimum deposit/withdrawal amounts' })
  updateMiningRates(
    @Body() dto: { miningDailyRate?: number; minDeposit?: number; minWithdrawal?: number },
  ) {
    return this.adminConfigService.updateMiningRates(dto);
  }

  @Put('support-links')
  @ApiOperation({ summary: 'Update WhatsApp and Telegram support links' })
  updateSupportLinks(
    @Body() dto: { whatsappLink?: string; telegramLink?: string },
  ) {
    return this.adminConfigService.updateSupportLinks(dto);
  }
}
