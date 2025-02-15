import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true, type: 'varchar', length: 60 })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  avatar: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  updatedAt: Date;
}
