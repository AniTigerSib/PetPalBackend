import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  username: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(100)
  email: string;
}
