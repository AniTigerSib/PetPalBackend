import { Profile } from 'src/users/entities/users-profile.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OauthAccount } from 'src/users/entities/oauth-account.entity';

export default interface UserPartial {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  profile: Profile;
  refreshTokens: RefreshToken[];
  oauthAccounts: OauthAccount[];
}
