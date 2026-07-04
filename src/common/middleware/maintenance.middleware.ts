import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Strip /api prefix if present so bypass works regardless of how NestJS mounts the router
    const path = req.originalUrl.split('?')[0].replace(/^\/api/, '');

    // Admin routes, health check, login, and token refresh always bypass maintenance
    if (
      path.startsWith('/admin') ||
      path.startsWith('/health') ||
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/refresh-token')
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
