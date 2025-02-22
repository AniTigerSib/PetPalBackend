import { ConfigService, registerAs } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;

  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1));

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      return 24 * 60 * 60; // Default to 1 day
  }
}

export default registerAs('jwt', () => {
  return {
    secret: configService.get<string>('JWT_SECRET'),
    audience: configService.get<string>('JWT_TOKEN_AUDIENCE'),
    issuer: configService.get<string>('JWT_TOKEN_ISSUER'),
    accessTokenTtl: configService.get<string>('JWT_ACCESS_TOKEN_TTL'),
    refreshTokenTtl: configService.get<string>('JWT_REFRESH_TOKEN_TTL'),
    accessTokenTtlNumeric: parseDuration(
      configService.get<string>('JWT_ACCESS_TOKEN_TTL'),
    ),
    refreshTokenTtlNumeric: parseDuration(
      configService.get<string>('JWT_REFRESH_TOKEN_TTL'),
    ),
  };
});
