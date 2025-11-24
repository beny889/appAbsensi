import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, ValidateIf } from 'class-validator';

export class SubmitFaceRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.faceImageBase64)
  @IsNotEmpty({ message: 'Either faceEmbedding or faceImageBase64 must be provided' })
  faceEmbedding?: string;

  @IsString()
  @IsOptional()
  faceImageUrl?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.faceEmbedding)
  @IsNotEmpty({ message: 'Either faceEmbedding or faceImageBase64 must be provided' })
  faceImageBase64?: string;
}
