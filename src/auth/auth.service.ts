import {
  Inject,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
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
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import RegisterDto from './dto/register.dto';
import LoginDto from './dto/login.dto';
import { isEmail } from 'class-validator';
import UserPartial from './interfaces/user-partial.interface';
import { JwtUserPayloadDto } from './dto/jwt-user-payload.dto';

// @Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
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

  async validateUser(
    loginDto: LoginDto,
  ): Promise<UserPartial | null | undefined> {
    try {
      let user: User | null = null;
      if (isEmail(loginDto.login)) {
        user = await this.usersService.findUserByEmail(loginDto.login);
      } else {
        user = await this.usersService.findUserByUsername(loginDto.login);
      }

      if (user && user.passwordHash) {
        const isPasswordValid = await this.hashingService.compare(
          loginDto.password,
          user.passwordHash,
        );
        if (isPasswordValid) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash, ...result } = user;
          return result;
        }
        return null;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  // TODO: For future use
  // Check if account is locked, email verified, etc. In not - throws exception.
  // async validateUserStatus(token: TokenInfoDto): Promise<void> {}

  async login(loginDto: LoginDto, deviceInfo?: DeviceInfoDto) {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user,
      deviceInfo,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const createUserDto: CreateUserDto = {
      ...registerDto,
      passwordHash: await this.hashingService.hash(registerDto.password),
    };
    await this.usersService.createUserSecure(createUserDto);
    // TODO: additional functions for user registration, like email notification, etc...
  }

  async refreshToken(
    refreshToken: string,
    deviceInfo?: DeviceInfoDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const token = await this.tokenRepository.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user'],
    });

    if (!token || new Date() > token.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // TODO: also add verifying tokent context

    await this.tokenRepository.update({ id: token.id }, { revoked: true });

    return this.generateTokens(token.user, deviceInfo);
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

  // PRIVATE /////////////////////////////////////////

  // For test
  // Method to invalidate all existing tokens for a user
  private async invalidateUserTokens(userId: number): Promise<void> {
    try {
      await this.usersService.shiftTokenVersion(userId);
      await this.tokenRepository.update(userId, { revoked: true });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
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

    const payloadDto: JwtUserPayloadDto = user;

    // Calculate expiration time
    const expiresIn = this.jwtConfiguration.accessTokenTtl;
    const expirationTime =
      issuedAt + this.jwtConfiguration.accessTokenTtlNumeric;

    const payload: JwtPayloadDto = {
      jti,
      sub: user.id,
      iat: issuedAt,
      exp: expirationTime,

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
