import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Analysis } from '../../analysis/entities/analysis.entity';

export type Stroke = 'forehand' | 'backhand';
export type Handedness = 'right' | 'left';
export type View = 'side' | 'front';
export type VideoStatus = 'uploaded' | 'processing' | 'done' | 'failed';

@Entity({ name: 'videos' })
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sport!: string;

  @Column()
  stroke!: Stroke;

  @Column()
  handedness!: Handedness;

  @Column({ nullable: true })
  view?: View;

  @Column()
  videoPath!: string;

  @Column({ default: 'uploaded' })
  status!: VideoStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToOne(() => Analysis, (analysis) => analysis.video)
  analysis?: Analysis;
}
