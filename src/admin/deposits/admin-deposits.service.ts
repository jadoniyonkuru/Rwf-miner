import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDepositStatusDto } from './dto/update-deposit-status.dto';
import { BulkApproveDto } from './dto/bulk-approve.dto';

@Injectable()
export class AdminDepositsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [deposits, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return { data: { deposits, total, page, limit } };
  }

  async findOne(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!deposit) throw new NotFoundException('Deposit not found');
    return { data: deposit };
  }

  async updateStatus(id: string, dto: UpdateDepositStatusDto) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== 'PENDING') {
      throw new BadRequestException('Only pending deposits can be updated');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id },
        data: { status: dto.status, notes: dto.notes },
      });

      if (dto.status === 'CONFIRMED') {
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'DEPOSIT',
            amount: deposit.amount,
            depositId: id,
          },
        });

        // Referral commissions — L1: 10%, L2: 3%
        const depositor = await tx.user.findUnique({
          where: { id: deposit.userId },
          select: {
            referrerId: true,
            referrer: { select: { id: true, referrerId: true } },
          },
        });

        const depositAmount = Number(deposit.amount);

        if (depositor?.referrerId) {
          const l1Amount = +(depositAmount * 0.10).toFixed(8);
          const l1Earning = await tx.miningEarning.create({
            data: {
              userId: depositor.referrerId,
              amount: l1Amount,
              note: `L1 referral commission (10%) from deposit`,
            },
          });
          await tx.transaction.create({
            data: {
              userId: depositor.referrerId,
              type: 'COMMISSION',
              amount: l1Amount,
              miningEarningId: l1Earning.id,
            },
          });
          await tx.notification.create({
            data: {
              userId: depositor.referrerId,
              title: 'Referral Commission Earned',
              message: `You earned ${l1Amount.toFixed(2)} USDT (10% L1 commission) from your referral's confirmed deposit.`,
              type: 'SUCCESS',
            },
          });

          if (depositor.referrer?.referrerId) {
            const l2Amount = +(depositAmount * 0.03).toFixed(8);
            const l2Earning = await tx.miningEarning.create({
              data: {
                userId: depositor.referrer.referrerId,
                amount: l2Amount,
                note: `L2 referral commission (3%) from deposit`,
              },
            });
            await tx.transaction.create({
              data: {
                userId: depositor.referrer.referrerId,
                type: 'COMMISSION',
                amount: l2Amount,
                miningEarningId: l2Earning.id,
              },
            });
            await tx.notification.create({
              data: {
                userId: depositor.referrer.referrerId,
                title: 'Referral Commission Earned',
                message: `You earned ${l2Amount.toFixed(2)} USDT (3% L2 commission) from a Level 2 referral's confirmed deposit.`,
                type: 'SUCCESS',
              },
            });
          }
        }
      }

      const notifTitle = dto.status === 'CONFIRMED' ? 'Deposit Confirmed' : 'Deposit Rejected';
      const notifMessage =
        dto.status === 'CONFIRMED'
          ? `Your deposit of ${deposit.amount} USDT has been confirmed and added to your balance.`
          : `Your deposit of ${deposit.amount} USDT was rejected.${dto.notes ? ' Reason: ' + dto.notes : ''}`;

      await tx.notification.create({
        data: {
          userId: deposit.userId,
          title: notifTitle,
          message: notifMessage,
          type: dto.status === 'CONFIRMED' ? 'SUCCESS' : 'ERROR',
        },
      });
    });

    return { message: `Deposit ${dto.status.toLowerCase()} successfully` };
  }

  async bulkApprove(dto: BulkApproveDto) {
    const results = await Promise.allSettled(
      dto.ids.map((id) => this.updateStatus(id, { status: 'CONFIRMED' })),
    );

    const approved = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { message: `Bulk approved: ${approved} succeeded, ${failed} failed` };
  }
}
