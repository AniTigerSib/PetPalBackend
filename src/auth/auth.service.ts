import {
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
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
import { TokenService } from 'src/token/token.service';

// @Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    @InjectRepository(RefreshToken)
    private readonly tokenRepository: Repository<RefreshToken>,
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
        loginDto.login = loginDto.login.toLowerCase();
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

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(user, deviceInfo);

    // TODO: add logging

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
      relations: {
        user: true,
      },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.tokenRepository.update({ id: token.id }, { revoked: true });

    if (new Date() > token.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // TODO: also add verifying tokent context (userAgent, ipAddress etc.)

    return this.tokenService.generateTokens(token.user, deviceInfo);
  }

  async invalidateUserTokens(userId: number): Promise<void> {
    try {
      await this.usersService.shiftTokenVersion(userId);
      await this.tokenRepository.update({ id: userId }, { revoked: true });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }
}
