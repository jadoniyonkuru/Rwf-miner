import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check — confirms API is running' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  @Get('sentry-test')
  @ApiOperation({ summary: 'Temporary — throws a test error to verify Sentry is working' })
  sentryTest() {
    throw new Error('Sentry test error — RWF Miner backend is connected');
  }
}
