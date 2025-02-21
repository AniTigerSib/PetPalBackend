import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JwtPayloadDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  username: string;
}
