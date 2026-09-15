import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './infrastructure/nestjs/http/filters/global-exception.filter';
import {
  resolveCorsOrigins,
  shouldEnableSwagger,
} from './infrastructure/nestjs/http/config/cors.config';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Use Helmet for security headers
  app.use(helmet());

  // Configure explicitly bounded CORS using the ALLOWED_ORIGINS environment variable
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = resolveCorsOrigins(
    process.env.ALLOWED_ORIGINS,
    isProduction,
    logger,
  );

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Register global exception filter to map domain errors to HTTP responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (shouldEnableSwagger(process.env.NODE_ENV, process.env.ENABLE_SWAGGER)) {
    const config = new DocumentBuilder()
      .setTitle('Collaborative Saving API')
      .setDescription('The API for the Collaborative Saving application.')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    logger.log('Swagger documentation enabled at /api');
  } else {
    logger.log(
      'Swagger documentation disabled in production (ENABLE_SWAGGER != true)',
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
