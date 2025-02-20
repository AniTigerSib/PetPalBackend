import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './users-profile.entity';
// import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { OauthAccount } from './oauth-account.entity';

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

  @Column({ nullable: true, length: 100 })
  fullName: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Profile)
  @JoinColumn()
  profile: Profile;

  // @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  // refreshTokens: RefreshToken[];

  @OneToMany(() => OauthAccount, (oauthAccount) => oauthAccount.user)
  oauthAccounts: OauthAccount[];
}
