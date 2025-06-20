import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username: string;

  // TODO: implement separate complete method
  // @IsOptional()
  // @IsString()
  // @IsEmail()
  // @MaxLength(100)
  // email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName: string;

  // TODO: implement separate complete method
  // @IsOptional()
  // @IsString()
  // @MaxLength(20)
  // phone: string;

  @IsOptional()
  @IsString()
  bio: string;
}
