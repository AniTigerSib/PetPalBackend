import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import jwtConfig from 'src/auth/config/jwt.config';
import DeviceInfoDto from 'src/auth/dto/device-info.dto';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import JwtPayload from 'src/auth/interfaces/jwt-payload.interface';
import UserPartial from 'src/auth/interfaces/user-partial.interface';
import UserPayload from 'src/auth/interfaces/user-payload.interface';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  private readonly logger = new Logger('TokenService');

  async verifyToken(
    token: string,
    options: {
      deviceInfo?: DeviceInfoDto;
      fullVerification?: boolean;
    } = {},
  ): Promise<JwtPayload> {
    const { deviceInfo, fullVerification = true } = options;

    try {
      const decoded = this.jwtService.verify<JwtPayload>(token, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        algorithms: ['HS512'],
      });

      if (!fullVerification) {
        return decoded;
      }

      // TODO: Setup caching

      const user = await this.usersService.findUserById(decoded.sub, {
        id: true,
        tokenVersion: true,
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (decoded.tokenVersion !== user.tokenVersion) {
        throw new UnauthorizedException('Token version mismatch');
      }

      if (deviceInfo && decoded.deviceInfo) {
        if (decoded.deviceInfo.deviceId !== deviceInfo.deviceId) {
          throw new UnauthorizedException('Invalid device');
        }
      }

      return decoded;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token or token has expired');
      } else if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  async generateTokens(
    user: UserPartial,
    deviceInfo?: DeviceInfoDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(user, deviceInfo);

    const refreshToken = await this.generateRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() +
        this.parseDuration(this.jwtConfiguration.refreshTokenTtl),
    );

    try {
      await this.tokenRepository.save({
        token: refreshToken,
        user,
        expiresAt,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }

    return { accessToken, refreshToken };
  }

  private generateTokenId(): string {
    // Generate unique token identifier
    return crypto.randomBytes(16).toString('hex');
  }

  private async generateAccessToken(
    user: UserPartial,
    deviceInfo?: DeviceInfoDto,
  ): Promise<string> {
    // Generate unique token identifier
    const jti = this.generateTokenId();

    // Get current timestamp
    const issuedAt = Math.floor(Date.now() / 1000);

    const payloadDto: UserPayload = {
      ...user,
      roles: user.roles?.map((role) => role.name),
    };

    // Calculate expiration time
    const expiresIn = this.jwtConfiguration.accessTokenTtl;

    const payload: JwtPayload = {
      jti,
      sub: user.id,
      iat: issuedAt,

      user: { ...payloadDto },

      // For test
      tokenVersion: user.tokenVersion,
      deviceInfo,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.jwtConfiguration.secret,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      expiresIn,
      algorithm: 'HS512', // or 'RS512' if using asymmetric keys
      // Optional: Use RS512 with private/public key pair
      // privateKey: fs.readFileSync('private-key.pem'),
    });
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    // Generate a secure random buffer
    const tokenBuffer = await new Promise<Buffer>((resolve, reject) => {
      crypto.randomBytes(48, (err, buffer) => {
        if (err) reject(err);
        resolve(buffer);
      });
    });

    // Create a hash that includes user context
    const hash = crypto
      .createHash('sha256')
      .update(tokenBuffer)
      .update(userId.toString())
      .update(Date.now().toString())
      .digest('hex');

    return hash;
  }

  private parseDuration(duration: string | undefined): number {
    if (!duration) return 0;

    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return 24 * 60 * 60 * 1000; // Default to 1 day
    }
  }
}
