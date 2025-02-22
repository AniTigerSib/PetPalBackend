import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserExtendedDto } from './user-extended.dto';

export class CreateUserDto extends UserExtendedDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  passwordHash: string;
}
