import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}${'•'.repeat(3)}@${domain}`;
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);

    return { data: { transactions, total, page, limit } };
  }

  async findOne(userId: string, id: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.userId !== userId) throw new ForbiddenException();
    return { data: tx };
  }

  async getLiveFeed() {
    // Latest 20 transactions across all users with masked emails
    const transactions = await this.prisma.transaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
      },
    });

    const feed = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      currency: 'USDT',
      maskedEmail: this.maskEmail(tx.user.email),
    }));

    return { data: feed };
  }
}
