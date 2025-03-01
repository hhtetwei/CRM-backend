import { Role } from '@prisma/client';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class userDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  role?: Role;
}
