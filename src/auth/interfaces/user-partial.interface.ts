import { RefreshToken } from '../entities/refresh-token.entity';
import { OauthAccount } from 'src/users/entities/oauth-account.entity';
import { Role } from 'src/users/entities/role.entity';

export default interface UserPartial {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage: string;
  bio: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
  refreshTokens: RefreshToken[];
  oauthAccounts: OauthAccount[];
}
