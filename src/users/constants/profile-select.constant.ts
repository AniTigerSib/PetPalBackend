import { FindOptionsSelect } from 'typeorm';
import { User } from '../entities/user.entity';

export const PROFILE_USER_SELECT: FindOptionsSelect<User> = {
  id: true,
  firstName: true,
  lastName: true,
  profileImage: true,
  username: true,
  bio: true,
} as const;
