import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, ValidateIf, IsArray } from 'class-validator';

export class SubmitFaceRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  // Legacy: single embedding (backward compatibility)
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.faceImageBase64 && !o.faceEmbeddings && !o.faceImagesBase64)
  faceEmbedding?: string;

  // New: multiple embeddings for better accuracy
  @IsArray()
  @IsOptional()
  @ValidateIf((o) => !o.faceEmbedding && !o.faceImageBase64 && !o.faceImagesBase64)
  faceEmbeddings?: string[];

  @IsString()
  @IsOptional()
  faceImageUrl?: string;

  // Legacy: single face image (backward compatibility)
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.faceEmbedding && !o.faceEmbeddings && !o.faceImagesBase64)
  faceImageBase64?: string;

  // New: multiple face images for better accuracy (5 different angles)
  @IsArray()
  @IsOptional()
  @ValidateIf((o) => !o.faceEmbedding && !o.faceEmbeddings && !o.faceImageBase64)
  faceImagesBase64?: string[];
}
