import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { AttendanceType } from '@prisma/client';

export class VerifyAnonymousDto {
  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType;

  @IsString()
  @IsNotEmpty()
  faceEmbedding: string; // Base64 encoded image or JSON string of face embedding array
}
