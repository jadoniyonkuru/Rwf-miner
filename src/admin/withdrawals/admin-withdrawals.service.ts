import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateWithdrawalStatusDto } from './dto/update-withdrawal-status.dto';
import { BulkApproveWithdrawalsDto } from './dto/bulk-approve-withdrawals.dto';

@Injectable()
export class AdminWithdrawalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    return { data: { withdrawals, total, page, limit } };
  }

  async findOne(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    return { data: withdrawal };
  }

  async updateStatus(id: string, dto: UpdateWithdrawalStatusDto) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    if (withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Only pending withdrawals can be updated');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: dto.status, notes: dto.notes },
      });

      if (dto.status === 'COMPLETED') {
        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'WITHDRAWAL',
            amount: withdrawal.amount,
            withdrawalId: id,
          },
        });
      }

      const notifTitle = dto.status === 'COMPLETED' ? 'Withdrawal Completed' : 'Withdrawal Rejected';
      const notifMessage =
        dto.status === 'COMPLETED'
          ? `Your withdrawal of ${withdrawal.amount} USDT has been processed successfully.`
          : `Your withdrawal of ${withdrawal.amount} USDT was rejected.${dto.notes ? ' Reason: ' + dto.notes : ''}`;

      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          title: notifTitle,
          message: notifMessage,
          type: dto.status === 'COMPLETED' ? 'SUCCESS' : 'ERROR',
        },
      });
    });

    return { message: `Withdrawal ${dto.status.toLowerCase()} successfully` };
  }

  async bulkApprove(dto: BulkApproveWithdrawalsDto) {
    const results = await Promise.allSettled(
      dto.ids.map((id) => this.updateStatus(id, { status: 'COMPLETED' })),
    );

    const approved = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { message: `Bulk approved: ${approved} succeeded, ${failed} failed` };
  }
}
