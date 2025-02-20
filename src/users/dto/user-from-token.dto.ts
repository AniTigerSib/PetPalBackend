import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class UserFromTokenDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  username: string;
}
