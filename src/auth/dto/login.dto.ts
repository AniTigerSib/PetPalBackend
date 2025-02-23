import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export default class LoginDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  login: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
