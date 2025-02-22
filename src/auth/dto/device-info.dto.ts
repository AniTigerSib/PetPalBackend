import { IsIP, IsNotEmpty, IsString } from 'class-validator';

export default class DeviceInfoDto {
  @IsNotEmpty()
  @IsString()
  userAgent: string;

  @IsNotEmpty()
  @IsString()
  @IsIP()
  ipAddress: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;
}
