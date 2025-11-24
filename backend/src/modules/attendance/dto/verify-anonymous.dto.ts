import { IsNotEmpty, IsNumber, IsString, IsEnum } from 'class-validator';
import { AttendanceType } from '@prisma/client';

export class VerifyAnonymousDto {
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
  @IsNotEmpty()
  faceEmbedding: string; // JSON string of face embedding array
}
