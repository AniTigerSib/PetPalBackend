import { Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import * as crypto from 'crypto';
import DeviceInfoDto from './dto/device-info.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

// @Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  private readonly logger = new Logger('AuthService');

  // async validateOAuthUser(userData: CreateUserDto) {
  //   let user = await this.usersService.findByEmail(userData.email);
  //   if (!user) {
  //     user = await this.usersService.createAndReturn(userData);
  //   }
  //   return user;
  // }

  // async signIn(username: string, pass: string) {
  //   const user = await this.usersService.findByUsername(username);
  //   if (user?.password !== pass) {
  //     throw new UnauthorizedException();
  //   }
  //   const payload = { username: user.username, sub: user.id };
  //   return {
  //     access_token: await this.jwtService.signAsync(payload),
  //   };
  // }

  async generateTokens(
    user: User,
    deviceInfo?: DeviceInfoDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(user, deviceInfo);

    const refreshToken = await this.generateRefreshToken(user.id);
    const expiresAt = new Date();
    expiresAt.setTime(
      expiresAt.getTime() +
        this.parseDuration(this.jwtConfiguration.refreshTokenTtl),
    );

    await this.tokenRepository.save({
      token: refreshToken,
      user,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  // PRIVATE /////////////////////////////////////////

  private generateTokenId(): string {
    // Generate unique token identifier
    return crypto.randomBytes(16).toString('hex');
  }

  private async generateAccessToken(
    user: User,
    deviceInfo?: DeviceInfoDto,
  ): Promise<string> {
    // Generate unique token identifier
    const jti = this.generateTokenId();

    // Get current timestamp
    const issuedAt = Math.floor(Date.now() / 1000);

    const payloadDto: JwtPayloadDto = user;

    // Calculate expiration time
    const expiresIn = this.jwtConfiguration.accessTokenTtl;
    const expirationTime =
      issuedAt + this.jwtConfiguration.accessTokenTtlNumeric;

    const payload = {
      jti,
      sub: user.id,
      iat: issuedAt,
      exp: expirationTime,

      user: { ...payloadDto },

      // For future use
      // tokenVersion: user.tokenVersion,
      deviceInfo: {
        ...deviceInfo,
      },
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

  // For future use
  // // Method to invalidate all existing tokens for a user
  // async invalidateUserTokens(userId: number): Promise<void> {
  //   try {
  //     await this.userRepository.update(
  //       { id: userId },
  //       { tokenVersion: () => 'token_version + 1' }
  //     );

  //     await this.tokenRepository.update(userId, { revoked: true });
  //   } catch (error) {
  //     this.logger.error(error);
  //     throw new InternalServerErrorException();
  //   }
  // }

  // For super future use
  // Check if account is locked, email verified, etc. In not - throws exception.
  // async validateUserStatus(token: TokenInfoDto): Promise<void> {}

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
