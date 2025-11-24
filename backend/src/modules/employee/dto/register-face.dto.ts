import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterFaceDto {
  @IsString()
  @IsNotEmpty()
  faceEmbedding: string;

  @IsString()
  @IsOptional()
  faceImageUrl?: string;
}
