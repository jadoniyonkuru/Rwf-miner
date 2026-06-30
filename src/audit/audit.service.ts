import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    userEmail?: string;
    action: string;
    ip?: string;
    status: 'success' | 'fail';
    meta?: Record<string, any>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        action: data.action,
        ip: data.ip,
        status: data.status,
        meta: data.meta ? JSON.stringify(data.meta) : null,
      },
    }).catch(() => {});
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: {
        logs: logs.map(l => ({
          ...l,
          meta: l.meta ? JSON.parse(l.meta) : null,
        })),
        total,
        page: +page,
        limit: +limit,
      },
    };
  }
}
