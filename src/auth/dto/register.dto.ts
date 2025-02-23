import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserExtendedDto } from 'src/users/dto/user-extended.dto';

export default class RegisterDto extends UserExtendedDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @IsStrongPassword()
  password: string;
}
