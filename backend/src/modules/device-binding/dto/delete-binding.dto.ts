import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class DeleteBindingDto {
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi untuk konfirmasi' })
  password: string;
}

export class ToggleBindingDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
