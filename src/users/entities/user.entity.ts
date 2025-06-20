import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { OauthAccount } from './oauth-account.entity';
import { Role } from './role.entity';
import { FriendRequest } from './friend-request.entity';
import { Blocklist } from './blocklist.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ nullable: true, length: 255 }) // NULL for OAuth only users
  passwordHash: string;

  @Column({ nullable: true, length: 50 })
  firstName: string;

  @Column({ nullable: true, length: 50 })
  lastName: string;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  profileImage: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable()
  roles: Role[];

  @OneToMany(() => FriendRequest, (friendRequest) => friendRequest.sender)
  sentFriendRequests: FriendRequest[];

  @OneToMany(() => FriendRequest, (friendRequest) => friendRequest.receiver)
  receivedFriendRequests: FriendRequest[];

  @OneToMany(() => Blocklist, (blocklist) => blocklist.blocker)
  blockedUsers: Blocklist[];

  // For test
  @Column({ default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => OauthAccount, (oauthAccount) => oauthAccount.user)
  oauthAccounts: OauthAccount[];
}
