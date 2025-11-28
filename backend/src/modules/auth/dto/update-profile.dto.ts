import { IsString, IsOptional, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
