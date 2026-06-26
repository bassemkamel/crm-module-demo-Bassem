import { PipelineStage } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateOpportunityDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  /** Deal value. Stored with 2 decimal places. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  /** Expected signature date (ISO 8601). */
  @IsDateString()
  expectedCloseDate!: string;

  /** Defaults to NEW when omitted. */
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  /** Id of the client this opportunity belongs to. */
  @IsString()
  @IsNotEmpty()
  clientId!: string;
}
