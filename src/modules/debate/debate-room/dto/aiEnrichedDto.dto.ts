import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryEnum, InterestEnum } from '@prisma/client';
import { CreateDebateRoomDto } from './create-debate-room.dto';

export class CategorizedInterestDto {
  @IsEnum(CategoryEnum)
  category: CategoryEnum;

  @IsArray()
  @IsEnum(InterestEnum, { each: true })
  interests: InterestEnum[];
}

export class AIEnrichedDto extends CreateDebateRoomDto {
  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategorizedInterestDto)
  categorized_interests: CategorizedInterestDto[];
}
