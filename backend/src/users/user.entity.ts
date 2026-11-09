import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Document } from '../documents/document.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: 'viewer' })
  role: string; // 'admin', 'editor', or 'viewer'

  @OneToMany(() => Document, document => document.uploadedBy)
  documents: Document[];
}
