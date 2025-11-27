import { IsString, IsBoolean, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class LogAttemptDto {
  @IsString()
  @IsNotEmpty()
  attemptType: 'CHECK_IN' | 'CHECK_OUT';

  @IsBoolean()
  success: boolean;

  @IsString()
  @IsOptional()
  matchedUserId?: string;

  @IsString()
  @IsOptional()
  matchedUserName?: string;

  @IsNumber()
  threshold: number;

  @IsNumber()
  @IsOptional()
  bestDistance?: number;

  @IsNumber()
  @IsOptional()
  bestSimilarity?: number;

  @IsNumber()
  totalUsersCompared: number;

  @IsString()
  @IsNotEmpty()
  allMatches: string; // JSON string array of all user comparisons
}
