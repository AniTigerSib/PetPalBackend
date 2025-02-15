import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}
