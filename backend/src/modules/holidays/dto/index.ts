import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean, IsArray } from 'class-validator';

export class CreateHolidayDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}

export class UpdateHolidayDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  userIds?: string[];
}
