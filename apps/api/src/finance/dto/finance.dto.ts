import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const FEE_TYPES = [
  'SCHOOL',
  'ACCEPTANCE',
  'MEDICAL',
  'HOSTEL',
  'LIBRARY',
  'GRADUATION',
  'OTHER',
] as const;

const GATEWAYS = ['FLUTTERWAVE', 'PAYSTACK', 'BANK_TRANSFER', 'CASH'] as const;

export class CreateFeeStructureDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(FEE_TYPES)
  type?: (typeof FEE_TYPES)[number];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  level?: number;

  @IsOptional()
  @IsString()
  programmeId?: string;

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsBoolean()
  allowInstallment?: boolean;
}

export class InitPaymentDto {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsEnum(GATEWAYS)
  gateway?: (typeof GATEWAYS)[number];

  @IsOptional()
  @IsString()
  currency?: string;
}

export class VerifyPaymentDto {
  @IsString()
  reference!: string;

  @IsOptional()
  @IsString()
  gatewayRef?: string;
}

export class RefundDto {
  @IsString()
  paymentId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateScholarshipDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  percentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
