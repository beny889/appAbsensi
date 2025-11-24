import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { AttendanceType } from '@prisma/client';

export class CreateAttendanceDto {
  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  faceImageUrl?: string;

  @IsNumber()
  @IsOptional()
  similarity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
