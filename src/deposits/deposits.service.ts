import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UploadQrDto } from './dto/upload-qr.dto';

@Injectable()
export class DepositsService {
  constructor(private prisma: PrismaService) {}

  async getDepositAddress() {
    const config = await this.prisma.platformConfig.findFirst();
    return {
      data: {
        address: config?.depositAddress || 'TELEXuLxzbW6ejKTL6qKJE48UA3LQDaBo',
        network: 'TRC-20',
        currency: 'USDT',
      },
    };
  }

  async getQr(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const config = await this.prisma.platformConfig.findFirst();

    return {
      data: {
        qr: user?.customQr || config?.defaultQr || null,
        isCustom: !!user?.customQr,
      },
    };
  }

  async uploadQr(userId: string, dto: UploadQrDto) {
    if (!dto.image.startsWith('data:image/')) {
      throw new BadRequestException('Image must be a valid Base64-encoded image');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { customQr: dto.image },
    });

    return { message: 'QR code uploaded successfully' };
  }

  async create(userId: string, dto: CreateDepositDto) {
    const config = await this.prisma.platformConfig.findFirst();
    const minDeposit = config ? Number(config.minDeposit) : 10;

    if (dto.amount < minDeposit) {
      throw new BadRequestException(`Minimum deposit is ${minDeposit} USDT`);
    }

    const existing = await this.prisma.deposit.findUnique({ where: { txHash: dto.txHash } });
    if (existing) throw new BadRequestException('Transaction hash already submitted');

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        amount: dto.amount,
        txHash: dto.txHash,
        status: 'PENDING',
        ...(dto.paymentMethodId && { paymentMethodId: dto.paymentMethodId }),
      },
    });

    return { message: 'Deposit submitted and pending confirmation', data: deposit };
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deposit.count({ where: { userId } }),
    ]);

    return { data: { deposits, total, page, limit } };
  }

  async findOne(userId: string, id: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.userId !== userId) throw new ForbiddenException();
    return { data: deposit };
  }

  async cancel(userId: string, id: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.userId !== userId) throw new ForbiddenException();
    if (deposit.status !== 'PENDING') {
      throw new BadRequestException('Only pending deposits can be cancelled');
    }

    await this.prisma.deposit.delete({ where: { id } });
    return { message: 'Deposit cancelled' };
  }
}
