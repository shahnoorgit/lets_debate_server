import { IsUUID } from 'class-validator';

export class AddParticipantDto {
  @IsUUID()
  roomId: string;
}
