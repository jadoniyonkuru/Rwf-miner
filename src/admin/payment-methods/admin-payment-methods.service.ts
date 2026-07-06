import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class AdminPaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const methods = await this.prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { deposits: true } } },
    });
    return { data: methods };
  }

  async create(dto: CreatePaymentMethodDto) {
    const method = await this.prisma.paymentMethod.create({
      data: {
        name: dto.name,
        type: dto.type ?? 'CRYPTO',
        accountNumber: dto.accountNumber,
        instructions: dto.instructions,
        qrCode: dto.qrCode,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    return { message: 'Payment method created', data: method };
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    await this.findOne(id);
    const method = await this.prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.qrCode !== undefined && { qrCode: dto.qrCode }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return { message: 'Payment method updated', data: method };
  }

  async toggle(id: string) {
    const method = await this.findOne(id);
    const updated = await this.prisma.paymentMethod.update({
      where: { id },
      data: { isActive: !method.isActive },
    });
    return { message: updated.isActive ? 'Payment method activated' : 'Payment method deactivated', data: updated };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.paymentMethod.delete({ where: { id } });
    return { message: 'Payment method deleted' };
  }

  private async findOne(id: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');
    return method;
  }
}
