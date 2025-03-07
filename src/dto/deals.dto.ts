import { DealStage } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsDate,
} from 'class-validator';

export class CreateDealDto {
  @IsNotEmpty()
  name: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  dealValue?: number;

  @IsOptional()
  @IsNumber()
  forecastValue?: number;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  expectedCloseDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  closeProbability?: number;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;

  @IsOptional()
  ownerId?: number;
}

export class UpdateDealDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  dealValue?: number;

  @IsOptional()
  @IsNumber()
  forecastValue?: number;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  closeProbability?: number;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;
}
