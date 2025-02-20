import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
