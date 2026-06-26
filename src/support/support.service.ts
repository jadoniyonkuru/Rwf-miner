import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getLinks() {
    const config = await this.prisma.platformConfig.findFirst();
    return {
      data: {
        whatsapp: config?.whatsappLink || '',
        telegram: config?.telegramLink || '',
      },
    };
  }
}
