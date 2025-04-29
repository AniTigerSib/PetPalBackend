import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity()
export class FriendRequest {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @ManyToOne(() => User, (user) => user.sentFriendRequests)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column()
  senderId: number;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @Column()
  receiverId: number;

  @Column({
    type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status: FriendRequestStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
