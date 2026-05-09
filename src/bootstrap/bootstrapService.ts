import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from '../filters/GlobalExceptionFilter';

export interface BootstrapOptions {
  module: any;
  port: number;
  serviceName: string;
  rawBody?: boolean;
}

export async function bootstrapService(options: BootstrapOptions): Promise<INestApplication> {
  const { module, port, serviceName, rawBody } = options;

  const app = await NestFactory.create(module, {
    bufferLogs: true,
    ...(rawBody ? { rawBody: true } : {}),
  });

  app.useLogger(app.get(Logger));

  // Security headers
  app.use(helmet());

  // Cookie parsing (required for OAuth flows)
  app.use(cookieParser());

  // CORS
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
    maxAge: 86400,
  });

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger — disabled in production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(`AREX — ${serviceName}`)
      .setDescription(`OpenAPI spec for ${serviceName}`)
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
  }

  // Enable graceful shutdown hooks (SIGTERM, SIGINT)
  app.enableShutdownHooks();

  await app.listen(port);
  return app;
}
