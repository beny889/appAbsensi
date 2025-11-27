import { IsString, IsNotEmpty } from 'class-validator';

export class ReplaceFaceDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
