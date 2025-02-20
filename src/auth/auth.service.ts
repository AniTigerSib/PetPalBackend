import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';

// @Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
}
