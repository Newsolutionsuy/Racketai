import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Video } from '../../videos/entities/video.entity';

@Entity({ name: 'analysis' })
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  videoId!: string;

  @OneToOne(() => Video, (video) => video.analysis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'videoId' })
  video!: Video;

  @Column('text')
  summary!: string;

  @Column('text')
  details!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
