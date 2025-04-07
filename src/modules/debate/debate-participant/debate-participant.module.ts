import { Module } from '@nestjs/common';
import { DebateParticipantService } from './debate-participant.service';
import { DebateParticipantController } from './debate-participant.controller';
import { OpinionJobModule } from 'src/jobs/opinion/opinion.module';

@Module({
  imports: [OpinionJobModule],
  controllers: [DebateParticipantController],
  providers: [DebateParticipantService],
})
export class DebateParticipantModule {}
