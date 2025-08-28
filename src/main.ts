import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomLoggerService } from './common/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get services
  const configService = app.get(ConfigService);
  
  // Create and set logger
  const logger = new CustomLoggerService();
  app.useLogger(logger);

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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    }),
  );

  // Compression
  app.use(compression());

  // Global pipes, filters, and interceptors
  app.useGlobalPipes(new CustomValidationPipe(logger));
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation setup
  if (env === 'development' || configService.get<boolean>('ENABLE_SWAGGER', true)) {
    const config = new DocumentBuilder()
      .setTitle('Koepon! API')
      .setDescription('個人VTuberのデジタルコンテンツをガチャ形式で販売するプラットフォーム')
      .setVersion('1.0.0')
      .addTag('Health', 'ヘルスチェック関連')
      .addTag('Auth', '認証・認可関連')
      .addTag('Users', 'ユーザー管理')
      .addTag('VTubers', 'VTuber管理')
      .addTag('Gacha', 'ガチャシステム')
      .addTag('Medals', '推しメダルシステム')
      .addTag('Exchange', '交換所機能')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document, {
      customSiteTitle: 'Koepon! API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('Received SIGTERM, shutting down gracefully', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('Received SIGINT, shutting down gracefully', 'Bootstrap');
    await app.close();
    process.exit(0);
  });

  // Start server
  await app.listen(port);
  logger.log(`🚀 Koepon! API server started on http://localhost:${port}`, 'Bootstrap');
  logger.log(`📱 Environment: ${env}`, 'Bootstrap');
  logger.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`, 'Bootstrap');
  logger.logBusinessEvent('SERVER_STARTED', { port, env });
}

void bootstrap();
