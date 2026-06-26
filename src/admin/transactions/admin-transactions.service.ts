import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminTransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, type?: string) {
    const skip = (page - 1) * limit;
    const where = type ? { type: type as any } : {};

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data: { transactions, total, page, limit } };
  }

  async findOne(id: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        deposit: true,
        withdrawal: true,
        miningEarning: true,
      },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return { data: tx };
  }
}
