import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const env = configService.get<string>('NODE_ENV', 'development');

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: env === 'production',
      crossOriginEmbedderPolicy: env === 'production',
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3001'),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // Compression
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: env === 'production',
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Start server
  await app.listen(port);
  console.log(`🚀 Koepon! API server started on http://localhost:${port}`);
  console.log(`📱 Environment: ${env}`);
}

void bootstrap();
