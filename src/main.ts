import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { json, urlencoded } from 'express';
import { ResponseInterceptor } from 'comman/interceptors/response-interceptor';
import { HttpErrorFilter } from 'comman/filters/httpException.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3002;

  // Add body parser middleware first
  app.use(json());
  app.use(urlencoded({ extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Removes unexpected fields from request body
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted fields are present
      transform: true,
    }),
  );

  // Interceptors and filters
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpErrorFilter());

  // Apply logger middleware globally with proper binding
  const loggerMiddleware = new LoggerMiddleware();
  app.use(loggerMiddleware.use.bind(loggerMiddleware));

  await app.listen(PORT);
  console.log(`Application is running on: http://localhost:${PORT}`);
}
bootstrap();
