import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class TokenInfoDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  username: string;

  // TODO: add rules, permissions
}
