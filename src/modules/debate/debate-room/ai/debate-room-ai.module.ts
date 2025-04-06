// ai.module.ts
import { Module } from '@nestjs/common';
import { AiService } from './debate-room-ai.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [AiService],
  imports: [HttpModule],
  exports: [AiService],
})
export class AiModule {}
