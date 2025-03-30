import { IsString, IsEmail, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoryEnum, InterestEnum } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  clerkId: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  fcmtoken?: string;

  @IsOptional()
  @IsObject()
  categories?: Record<CategoryEnum, InterestEnum[]>;
}
