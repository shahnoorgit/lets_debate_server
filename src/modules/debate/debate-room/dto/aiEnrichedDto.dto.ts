import { IsString, IsNumber, IsArray } from 'class-validator';
import { CategoryEnum, InterestEnum } from '@prisma/client';
import { CreateDebateRoomDto } from './create-debate-room.dto';

export class AIEnrichedDto extends CreateDebateRoomDto {
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsArray()
  categories: CategoryEnum[];

  @IsArray()
  sub_categories: InterestEnum[];
}
