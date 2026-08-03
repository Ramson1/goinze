import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'INTERVIEW',
  'APPROVED',
  'REJECTED',
  'ADMITTED',
] as const;

export class ApplyDto {
  @IsOptional()
  @IsString()
  schoolSlug?: string;

  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(GENDERS)
  gender?: (typeof GENDERS)[number];

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  programmeId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class ReviewApplicationDto {
  @IsEnum(APPLICATION_STATUSES)
  status!: (typeof APPLICATION_STATUSES)[number];

  @IsOptional()
  score?: number;

  @IsOptional()
  @IsDateString()
  interviewDate?: string;
}
