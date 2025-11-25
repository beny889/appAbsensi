import { IsString, IsNotEmpty, Matches, IsBoolean, IsOptional } from 'class-validator';

export class CreateWorkScheduleDto {
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'checkInTime must be in HH:MM format (e.g., 09:00)',
  })
  checkInTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'checkOutTime must be in HH:MM format (e.g., 17:00)',
  })
  checkOutTime: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
