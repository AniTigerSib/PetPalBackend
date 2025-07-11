import { applyDecorators, SetMetadata } from '@nestjs/common';
// import { JwtAuthGuard } from '../guards/jwt-auth.guard';
// import { RolesGuard } from '../guards/roles.guard';

export const Auth = (...args: string[]) => {
  return applyDecorators(SetMetadata('roles', args));
};
