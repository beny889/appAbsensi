import { IsString, IsEmail, IsNotEmpty, IsEnum, IsOptional, MinLength, ValidateIf, IsDateString } from 'class-validator';
import { Role } from '@prisma/client';

export class ApproveRegistrationDto {
  // Email is optional - will be auto-generated if not provided
  @ValidateIf((o) => o.email !== undefined && o.email !== null && o.email !== '')
  @IsEmail()
  email?: string;

  // Password is optional - will be auto-generated if not provided
  @ValidateIf((o) => o.password !== undefined && o.password !== null && o.password !== '')
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;  // Format: YYYY-MM-DD - Tanggal mulai bekerja
}

export class RejectRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters long' })
  reason: string;
}
