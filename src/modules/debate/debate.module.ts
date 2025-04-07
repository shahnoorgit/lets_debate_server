import { Module } from '@nestjs/common';
import { DebateRoomModule } from './debate-room/debate-room.module';
import { DebateParticipantModule } from './debate-participant/debate-participant.module';

@Module({
  imports: [DebateRoomModule, DebateParticipantModule],
})
export class DebateModule {}
