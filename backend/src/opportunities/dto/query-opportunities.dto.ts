import { ClientType, PipelineStage } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class QueryOpportunitiesDto {
  /** Filter by pipeline stage. */
  @IsOptional()
  @IsEnum(PipelineStage)
  stage?: PipelineStage;

  /** Filter by the related client's type. */
  @IsOptional()
  @IsEnum(ClientType)
  clientType?: ClientType;

  /** When true, only return problematic (late or stagnant) opportunities. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  problematic?: boolean;

  /** 1-based page number. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Page size (max 100). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
