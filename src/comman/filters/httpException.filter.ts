import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      success: false,
      message: exception.message || 'Internal server error',
      statusCode: status,
      errors: exception.response?.message || null,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
