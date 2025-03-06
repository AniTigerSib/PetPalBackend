import DeviceInfoDto from '../dto/device-info.dto';
import UserPayload from './user-payload.interface';

export default interface JwtPayload {
  jti: string;
  sub: number;
  iat: number;
  user: UserPayload;
  tokenVersion: number;
  deviceInfo?: DeviceInfoDto;
}
