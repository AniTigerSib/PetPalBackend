import { IsNotEmpty, IsString } from 'class-validator';
import { UserExtendedDto } from './user-extended.dto';

export class CreateUserDto extends UserExtendedDto {
  @IsNotEmpty()
  @IsString()
  passwordHash: string;
}
