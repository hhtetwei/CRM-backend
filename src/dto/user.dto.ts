import { Role } from '@prisma/client';
import { IsOptional, IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class userDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  password: string;

  @IsNotEmpty()
  @IsString()
  role?: Role;
}
