import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.use(helmet({
    contentSecurityPolicy: false,   // API responses don't need CSP
    frameguard: false,              // use CSP frame-ancestors instead of X-Frame-Options
    xPoweredBy: true,               // keep removing X-Powered-By
  }));
  app.setGlobalPrefix(process.env.API_PREFIX || 'api');

  const extraOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://rwf-miner-ui.vercel.app',
    ...extraOrigins,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('RWF Miner API')
    .setDescription('RWF Miner Portal — Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log('\n=============================================================');
  console.log('  RWF Miner API — Day 9: Security + Referral System       ');
  console.log('=============================================================');
  console.log(`  API Base URL  : http://localhost:${port}/api`);
  console.log(`  Swagger Docs  : http://localhost:${port}/docs`);
  console.log(`  Health Check  : http://localhost:${port}/api/health`);
  console.log('=============================================================\n');
}

bootstrap();
