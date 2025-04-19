import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

import { DebateRoomService } from './debate-room.service';
import { DebateRoomController } from './debate-room.controller';
import { HttpModule } from '@nestjs/axios';
import { AiModule } from './ai/debate-room-ai.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    AiModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        ttl: 3600,
        max: 1000,
      }),
    }),
  ],
  controllers: [DebateRoomController],
  providers: [DebateRoomService],
})
export class DebateRoomModule {}
