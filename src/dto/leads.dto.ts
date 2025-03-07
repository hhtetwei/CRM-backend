import { LeadStatus } from '@prisma/client';
import { IsEmail, IsOptional } from 'class-validator';

export class CreateLeadDto {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  phone?: string;

  @IsOptional()
  company: string;

  status: LeadStatus;
}

export class UpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
}
