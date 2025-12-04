import { IsEmail, IsString, IsOptional, IsEnum, IsArray, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.BRANCH_ADMIN;

  @IsArray()
  @IsOptional()
  allowedMenus?: string[];  // e.g. ["dashboard", "employees", "attendance"]

  @IsArray()
  @IsOptional()
  branchIds?: string[];  // Branches this admin can access

  @IsString()
  @IsOptional()
  defaultBranchId?: string;  // Default branch to view
}
