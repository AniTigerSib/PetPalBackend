import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ unique: true, type: 'text' })
  token: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // For future use
  // @Column({ nullable: true })
  // userAgent: string;

  // @Column({ nullable: true })
  // ipAddress: string;

  // @Column({ nullable: true })
  // revokedReason: string;

  // @Column({ type: 'timestamptz', nullable: true })
  // revokedAt: Date;

  // // Optional: Add a family identifier for token rotation
  // @Column({ nullable: true })
  // tokenFamily: string;

  @ManyToOne(() => User, (user) => user.refreshTokens)
  user: User;
}
