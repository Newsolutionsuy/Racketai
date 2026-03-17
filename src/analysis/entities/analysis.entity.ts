import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { StrokeMetrics } from '../../analysis-client/analysis-client.service';
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

  @Column({ type: 'jsonb', nullable: true })
  metrics?: StrokeMetrics | null;

  @Column({ default: 'unknown' })
  analyzedBy!: string;

  @Column('text', { nullable: true })
  couldNotUseAIReason?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
