import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Strip /api prefix if present so bypass works regardless of how NestJS mounts the router
    const path = req.originalUrl.split('?')[0].replace(/^\/api/, '');

    // Admin routes, health check, login, token refresh, and support links always bypass maintenance
    if (
      path.startsWith('/admin') ||
      path.startsWith('/health') ||
      path.startsWith('/auth/login') ||
      path.startsWith('/auth/refresh-token') ||
      path.startsWith('/support/links') ||
      path.startsWith('/payment-methods')
    ) {
      return next();
    }

    const config = await this.prisma.platformConfig.findFirst({
      select: { isMaintenanceMode: true, maintenanceMessage: true },
    });

    if (!config?.isMaintenanceMode) {
      return next();
    }

    // Admins bypass maintenance — decode JWT role claim (no verification needed here,
    // guards on each route still enforce full JWT validation)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
          if (payload?.role === 'ADMIN') return next();
        }
      } catch { /* invalid token — fall through and block */ }
    }

    throw new ServiceUnavailableException(config.maintenanceMessage || 'Under maintenance. Please check back soon.');
  }
}
