import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

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
      useFactory: async (config: ConfigService) => ({
        ttl: 1,
        store: await redisStore({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
        }),
      }),
    }),
  ],
  controllers: [DebateRoomController],
  providers: [DebateRoomService],
})
export class DebateRoomModule {}
