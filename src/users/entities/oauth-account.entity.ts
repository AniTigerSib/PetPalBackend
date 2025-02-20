import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class OauthAccount {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ length: 50 })
  provider: string;

  @Column({ length: 255 })
  providerUserId: string;

  @Column({ nullable: true, type: 'text' })
  accessToken: string;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string;

  @Column({ nullable: true, type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.oauthAccounts)
  user: User;
}
