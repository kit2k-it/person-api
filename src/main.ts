import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from '@exortek/express-mongo-sanitize';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  const corsOrigin = configService.get<string[]>('app.corsOrigin') || [
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: corsOrigin,
    credentials: configService.get<boolean>('app.corsCredentials') || false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Compression
  app.use(compression());

  // Sanitize input (prevent NoSQL injection)
  app.use(mongoSanitize());

  // Rate limiting (simple in-memory implementation)
  const rateLimitConfig = {
    windowMs: configService.get<number>('rateLimit.windowMs') || 15 * 60 * 1000,
    max: configService.get<number>('rateLimit.max') || 100,
    message: 'Too many requests from this client, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Global prefix
  const apiVersion = configService.get<string>('app.apiVersion') || 'v1';
  app.setGlobalPrefix(`api/${apiVersion}`);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        return new Error(
          JSON.stringify({
            success: false,
            message: 'Validation error',
            errors: formattedErrors,
          }),
        );
      },
    }),
  );

  // Swagger documentation
  if (configService.get<string>('app.nodeEnv') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(
        configService.get<string>('app.appName') ||
          'Personal Management System API',
      )
      .setDescription('Personal Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth(
        configService.get<string>('jwt.cookieName') || 'access_token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
  console.log(
    `Application is running on: http://localhost:${port}/api/${apiVersion}`,
  );
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
}

bootstrap();
