import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { AttendanceType } from '@prisma/client';

export class VerifyFaceDto {
  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType;

  @IsString()
  @IsNotEmpty()
  faceEmbedding: string;
}
