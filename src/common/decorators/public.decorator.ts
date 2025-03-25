import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/**
 * Decorator that marks a route as public (no authentication required)
 * @example
 * @Public()
 * @Get('public-route')
 * publicRoute() {
 *   return 'This route is public';
 * }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
