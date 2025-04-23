// debate-participant.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OpinionJobModule } from 'src/jobs/opinion/opinion.module';
import { DebateParticipantController } from './debate-participant.controller';
import { DebateParticipantService } from './debate-participant.service';

@Module({
  imports: [
    OpinionJobModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          ttl: 10,
        }),
      }),
    }),
  ],
  controllers: [DebateParticipantController],
  providers: [DebateParticipantService],
})
export class DebateParticipantModule {}
