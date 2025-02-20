import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserDto } from './user.dto';

export class UserExtendedDto extends UserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  passwordHash: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;
}
