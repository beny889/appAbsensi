import { IsEmail, IsString, IsOptional, IsEnum, IsArray, MinLength, IsBoolean } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateAdminDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  allowedMenus?: string[];

  @IsArray()
  @IsOptional()
  branchIds?: string[];

  @IsString()
  @IsOptional()
  defaultBranchId?: string;
}
