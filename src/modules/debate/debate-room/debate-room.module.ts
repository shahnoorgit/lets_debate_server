import { Module } from '@nestjs/common';
import { DebateRoomService } from './debate-room.service';
import { DebateRoomController } from './debate-room.controller';
import { HttpModule } from '@nestjs/axios';
import { AiModule } from './ai/debate-room-ai.module';

@Module({
  imports: [HttpModule, AiModule],
  controllers: [DebateRoomController],
  providers: [DebateRoomService],
})
export class DebateRoomModule {}
