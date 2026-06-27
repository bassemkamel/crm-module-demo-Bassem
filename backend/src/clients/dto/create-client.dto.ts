import { ClientType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

/**
 * A client is either a COMPANY or an INDIVIDUAL. The discriminating `type`
 * field decides which fields are required (see DECISIONS.md). Type-specific
 * fields are optional in the type but conditionally required via `@ValidateIf`.
 */
export class CreateClientDto {
  @IsEnum(ClientType)
  type!: ClientType;

  // Shared contact fields
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Company-specific
  @ValidateIf((o: CreateClientDto) => o.type === ClientType.COMPANY)
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  // Individual-specific
  @ValidateIf((o: CreateClientDto) => o.type === ClientType.INDIVIDUAL)
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ValidateIf((o: CreateClientDto) => o.type === ClientType.INDIVIDUAL)
  @IsString()
  @IsNotEmpty()
  lastName?: string;
}
