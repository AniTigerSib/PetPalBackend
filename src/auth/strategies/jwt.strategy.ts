import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import jwtConfig from '../config/jwt.config';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: jwtConfiguration.issuer ?? '',
      audience: jwtConfiguration.audience ?? '',
      algorithms: ['HS512'],
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.secret ?? '',
      passReqToCallback: true,
    });
  }
  private readonly logger = new Logger('JwtStrategy');

  async validate(request: Request, payload: JwtPayloadDto) {
    try {
      const user = await this.usersService.findUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      const currentDevice = request.headers['user-agent'];
      if (
        payload.deviceInfo &&
        payload.deviceInfo.userAgent !== currentDevice
      ) {
        throw new UnauthorizedException('Invalid device');
      }

      return payload.user;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException();
    }
  }
}
