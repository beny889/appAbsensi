import { IsString, IsOptional, Matches, IsBoolean } from 'class-validator';

export class UpdateWorkScheduleDto {
  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'checkInTime must be in HH:MM format (e.g., 09:00)',
  })
  checkInTime?: string;

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'checkOutTime must be in HH:MM format (e.g., 17:00)',
  })
  checkOutTime?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
