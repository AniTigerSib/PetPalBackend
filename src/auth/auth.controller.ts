import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import LoginDto from './dto/login.dto';
import RegisterDto from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import AuthorizedRequest from 'src/common/interfaces/request.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { Auth } from './decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }

  @Auth('user')
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: AuthorizedRequest) {
    return this.authService.invalidateUserTokens(request.user.id);
  }
}
