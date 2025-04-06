import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (data === null) {
          response.status(200); // Set status code to 404
          return {
            success: false,
            statusCode: 404,
            message: 'User not found',
            data: null,
          };
        }

        return {
          success: true,
          statusCode: response.statusCode || 200, // Ensure statusCode is included
          message: 'Request successful',
          data,
        };
      }),
    );
  }
}
