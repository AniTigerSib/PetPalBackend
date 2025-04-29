import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
@Unique(['blockerId', 'blockedId'])
export class Blocklist {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @ManyToOne(() => User, (user) => user.blockedUsers)
  @JoinColumn({ name: 'blockerId' })
  blocker: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blockedId' })
  blocked: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
