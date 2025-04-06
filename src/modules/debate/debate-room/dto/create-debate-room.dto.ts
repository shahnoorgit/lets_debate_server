import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';
import { InterestEnum } from '@prisma/client'; // Assuming you have this from Prisma client

export class CreateDebateRoomDto {
  @IsString()
  title: string;

  @IsString()
  image: string; // URL to the image

  @IsString()
  description: string;

  @IsNumber()
  duration: number; // Duration in hours
}
