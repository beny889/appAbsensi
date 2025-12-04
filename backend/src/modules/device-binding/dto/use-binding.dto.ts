import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UseBindingDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode binding wajib diisi' })
  @MaxLength(5, { message: 'Kode binding maksimal 5 karakter' })
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Nama device maksimal 100 karakter' })
  deviceName?: string;
}

export class ValidateBindingDto {
  @IsString()
  @IsNotEmpty({ message: 'Kode binding wajib diisi' })
  code: string;
}
