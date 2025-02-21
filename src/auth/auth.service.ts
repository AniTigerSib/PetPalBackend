import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { v4 as uuidv4 } from 'uuid';

// @Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

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

  // async generateTokens(user: User) {
  //   const payload: Partial<JwtPayloadDto> = {
  //     // id: user.id,
  //     // username: user.username,
  //     email: user.email,
  //   };

  //   // const accessToken = this.jwtService.sign(payload);

  //   const accessToken = this.signToken<Partial<JwtPayloadDto>>(
  //     user.id,
  //     this.jwtConfiguration.accessTokenTtl,
  //     payload,
  //   );

  //   const refreshToken = uuidv4
  // }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
