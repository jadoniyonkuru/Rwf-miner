import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Admin routes, health check, login, and token refresh always bypass maintenance
    if (
      req.path.startsWith('/api/admin') ||
      req.path.startsWith('/api/health') ||
      req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/auth/refresh-token')
    ) {
      return next();
    }

    const config = await this.prisma.platformConfig.findFirst({
      select: { isMaintenanceMode: true, maintenanceMessage: true },
    });

    if (config?.isMaintenanceMode) {
      throw new ServiceUnavailableException(config.maintenanceMessage || 'Under maintenance. Please check back soon.');
    }

    next();
  }
}
