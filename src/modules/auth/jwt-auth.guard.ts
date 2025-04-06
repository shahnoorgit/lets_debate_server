import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';
import { IS_PUBLIC_KEY } from 'src/comman/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private client: jwksClient.JwksClient;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.client = jwksClient({
      jwksUri: this.configService.get<string>('JWKS_URI')!,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000, // Cache for 10 minutes
    });
  }

  private getKey = (
    header: any,
    callback: (err: any, key?: string) => void,
  ) => {
    this.client.getSigningKey(header.kid, (err, key) => {
      if (err || !key) {
        return callback(new UnauthorizedException('Invalid signing key'));
      }

      const signingKey =
        (key as jwksClient.CertSigningKey).publicKey ||
        (key as jwksClient.RsaSigningKey).rsaPublicKey;

      if (!signingKey) {
        return callback(new UnauthorizedException('Signing key is undefined'));
      }

      callback(null, signingKey);
    });
  };

  canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );

    if (isPublic) {
      return Promise.resolve(true); // Bypass auth
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        (header, callback) => this.getKey(header, callback),
        { algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) {
            reject(new UnauthorizedException('Invalid token'));
          } else {
            request.user = decoded;
            resolve(true);
          }
        },
      );
    });
  }
}
