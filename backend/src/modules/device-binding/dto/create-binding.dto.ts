import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBindingDto {
  @IsString()
  @IsNotEmpty({ message: 'Branch ID wajib diisi' })
  branchId: string;
}
