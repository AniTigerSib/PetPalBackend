import { JwtUserPayloadDto } from './jwt-user-payload.dto';
import DeviceInfoDto from './device-info.dto';

export class JwtPayloadDto {
  jti: string;
  sub: number;
  iat: number;
  exp: number;
  user: JwtUserPayloadDto;
  tokenVersion: number;
  deviceInfo?: DeviceInfoDto;
}
