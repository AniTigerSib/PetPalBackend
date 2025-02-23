import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class JwtUserPayloadDto {
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

  // TODO: add rules, permissions
}
