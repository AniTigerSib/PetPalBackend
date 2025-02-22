import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UserDto } from './user.dto';

export class UserExtendedDto extends UserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;
}
