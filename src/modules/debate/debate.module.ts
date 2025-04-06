import { Module } from '@nestjs/common';
import { DebateRoomModule } from './debate-room/debate-room.module';

@Module({
  imports: [DebateRoomModule],
})
export class DebateModule {}
