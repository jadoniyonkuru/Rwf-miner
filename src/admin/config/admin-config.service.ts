import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class AdminConfigService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateConfig() {
    let config = await this.prisma.platformConfig.findFirst();
    if (!config) {
      config = await this.prisma.platformConfig.create({ data: {} });
    }
    return config;
  }

  async getConfig() {
    const config = await this.getOrCreateConfig();
    return { data: config };
  }

  async updateConfig(dto: UpdateConfigDto) {
    const config = await this.getOrCreateConfig();
    const updated = await this.prisma.platformConfig.update({
      where: { id: config.id },
      data: dto,
    });
    return { message: 'Configuration updated', data: updated };
  }

  async getDepositAddress() {
    const config = await this.getOrCreateConfig();
    return { data: { depositAddress: config.depositAddress, network: 'TRC-20' } };
  }

  async updateDepositAddress(address: string) {
    const config = await this.getOrCreateConfig();
    await this.prisma.platformConfig.update({
      where: { id: config.id },
      data: { depositAddress: address },
    });
    return { message: 'Deposit address updated' };
  }

  async getDefaultQr() {
    const config = await this.getOrCreateConfig();
    return { data: { qr: config.defaultQr } };
  }

  async updateDefaultQr(qr: string) {
    const config = await this.getOrCreateConfig();
    await this.prisma.platformConfig.update({
      where: { id: config.id },
      data: { defaultQr: qr },
    });
    return { message: 'Default QR code updated' };
  }

  async getMiningRates() {
    const config = await this.getOrCreateConfig();
    return {
      data: {
        dailyRate: Number(config.miningDailyRate),
        minDeposit: Number(config.minDeposit),
        minWithdrawal: Number(config.minWithdrawal),
      },
    };
  }

  async updateMiningRates(dto: { miningDailyRate?: number; minDeposit?: number; minWithdrawal?: number }) {
    const config = await this.getOrCreateConfig();
    const updated = await this.prisma.platformConfig.update({
      where: { id: config.id },
      data: dto,
    });
    return { message: 'Mining rates updated', data: updated };
  }

  async updateSupportLinks(dto: { whatsappLink?: string; telegramLink?: string }) {
    const config = await this.getOrCreateConfig();
    await this.prisma.platformConfig.update({
      where: { id: config.id },
      data: dto,
    });
    return { message: 'Support links updated' };
  }

  async toggleMaintenance(isMaintenanceMode: boolean, maintenanceMessage?: string) {
    const config = await this.getOrCreateConfig();
    await this.prisma.platformConfig.update({
      where: { id: config.id },
      data: {
        isMaintenanceMode,
        ...(maintenanceMessage !== undefined && { maintenanceMessage }),
      },
    });
    return { message: isMaintenanceMode ? 'Maintenance mode enabled' : 'Maintenance mode disabled' };
  }
}
