import { FindOptionsSelect } from 'typeorm';
import { User } from '../entities/user.entity';

export const SEARCH_USER_SELECT: FindOptionsSelect<User> = {
  id: true,
  firstName: true,
  lastName: true,
  profileImage: true,
} as const;
