import { ClientType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QueryClientsDto {
  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;
}
