import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async findAllActive(forType?: 'deposit' | 'withdrawal') {
    const where: any = { isActive: true };
    if (forType === 'deposit') where.allowDeposit = true;
    if (forType === 'withdrawal') where.allowWithdrawal = true;

    const methods = await this.prisma.paymentMethod.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        type: true,
        accountNumber: true,
        instructions: true,
        qrCode: true,
        sortOrder: true,
        allowDeposit: true,
        allowWithdrawal: true,
      },
    });
    return { data: methods };
  }
}
