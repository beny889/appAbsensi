import { IsNotEmpty, IsString, IsNumber, IsEnum } from 'class-validator';
import { AttendanceType } from '@prisma/client';

export class VerifyFaceDto {
  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType;

  @IsString()
  @IsNotEmpty()
  faceEmbedding: string;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;
}
