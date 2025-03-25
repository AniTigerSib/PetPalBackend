import {
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TokenService } from 'src/token/token.service';
import { IS_PUBLIC_KEY } from 'src/common/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for public routes using metadata
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    try {
      // Get the request
      const request = context.switchToHttp().getRequest<Request>();

      // Extract token from header
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const { user } = await this.tokenService.verifyToken(token, {
        fullVerification: true,
      });

      request.user = user;

      return true;
    } catch (error) {
      // Test variant
      if (error instanceof Error) {
        this.logger.error(
          `Authentication failed: ${error.message}`,
          // error.stack,
        );

        if (error instanceof HttpException) {
          throw error;
        }
      } else {
        this.logger.error('Authentication failed with an unknown error');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
