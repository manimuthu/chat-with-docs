import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column({ type: 'varchar', nullable: true })
  storageFilename: string | null;

  @CreateDateColumn()
  uploadedAt: Date;

  @ManyToOne(() => User, user => user.documents, { eager: true })
  uploadedBy: User;

}
