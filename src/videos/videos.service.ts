import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from '../analysis/entities/analysis.entity';
import { UploadVideoDto } from './dto/upload-video.dto';
import { Video } from './entities/video.entity';

@Injectable()
export class VideosService {
  constructor(
    @InjectRepository(Video)
    private readonly videosRepository: Repository<Video>,
    @InjectRepository(Analysis)
    private readonly analysisRepository: Repository<Analysis>,
    @InjectQueue('video-analysis')
    private readonly videoAnalysisQueue: Queue,
  ) {}

  async createVideo(
    uploadVideoDto: UploadVideoDto,
    videoPath: string,
  ): Promise<{ videoId: string; status: 'uploaded' }> {
    const createdVideo = this.videosRepository.create({
      ...uploadVideoDto,
      videoPath,
      status: 'uploaded',
    });

    const video = await this.videosRepository.save(createdVideo);

    await this.videoAnalysisQueue.add('analyze-video', { videoId: video.id });

    await this.videosRepository.update({ id: video.id }, { status: 'processing' });

    return {
      videoId: video.id,
      status: 'uploaded',
    };
  }

  async getVideoById(id: string): Promise<{
    videoId: string;
    status: string;
    analysis:
      | {
          summary: string;
          details: string;
          analyzedBy: string;
          couldNotUseAIReason: string | null;
        }
      | null;
  }> {
    const video = await this.videosRepository.findOne({
      where: { id },
      relations: ['analysis'],
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return {
      videoId: video.id,
      status: video.status,
      analysis: video.analysis
        ? {
            summary: video.analysis.summary,
            details: video.analysis.details,
            analyzedBy: video.analysis.analyzedBy,
            couldNotUseAIReason: video.analysis.couldNotUseAIReason ?? null,
          }
        : null,
    };
  }

  async saveAnalysis(
    videoId: string,
    summary: string,
    details: string,
    analyzedBy: string,
    couldNotUseAIReason: string | null,
  ): Promise<void> {
    await this.analysisRepository.save(
      this.analysisRepository.create({
        videoId,
        summary,
        details,
        analyzedBy,
        couldNotUseAIReason,
      }),
    );

    await this.videosRepository.update({ id: videoId }, { status: 'done' });
  }

  async markAsFailed(videoId: string): Promise<void> {
    await this.videosRepository.update({ id: videoId }, { status: 'failed' });
  }

  async getVideoForAnalysis(videoId: string): Promise<Video> {
    const video = await this.videosRepository.findOne({ where: { id: videoId } });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }
}
