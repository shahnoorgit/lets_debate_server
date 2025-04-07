import { IsBoolean, IsString, IsUUID } from 'class-validator';

export class AddOpinionDto {
  @IsUUID()
  roomId: string;

  @IsString()
  opinion: string;

  @IsBoolean()
  isAgree: boolean;
}
