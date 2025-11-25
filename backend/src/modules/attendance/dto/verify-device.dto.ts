import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { AttendanceType } from '@prisma/client';

/**
 * DTO for device-verified attendance
 * Used when Android app verifies face on-device using MobileFaceNet
 * and sends the matched userId to backend
 */
export class VerifyDeviceDto {
  @IsString()
  @IsNotEmpty()
  odId: string;  // User's OD ID (unique identifier)

  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType;

  @IsNumber()
  @IsOptional()
  distance?: number;  // Face matching distance (lower = better match)

  @IsNumber()
  @IsOptional()
  similarity?: number;  // Similarity percentage (for display)
}
