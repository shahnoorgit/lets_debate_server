import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log request
    this.logger.log(
      `[${method}] ${originalUrl} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    // Log request body if exists (excluding sensitive data)
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      const sanitizedBody = this.sanitizeBody(req.body);
      this.logger.debug('Request Body:', sanitizedBody);
    }

    // Capture response
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;

      this.logger.log(
        `[${method}] ${originalUrl} ${statusCode} ${contentLength}B - ${responseTime}ms`,
      );
    });

    next();
  }

  private sanitizeBody(body: any): any {
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
} 