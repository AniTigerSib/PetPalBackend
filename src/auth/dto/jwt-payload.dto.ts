import { UserPayloadDto } from './user-payload.dto';
import DeviceInfoDto from './device-info.dto';

export class JwtPayloadDto {
  jti: string;
  sub: number;
  iat: number;
  user: UserPayloadDto;
  tokenVersion: number;
  deviceInfo?: DeviceInfoDto;
}
