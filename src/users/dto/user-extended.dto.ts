import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserDto } from './user.dto';

export class UserExtendedDto extends UserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;
}
