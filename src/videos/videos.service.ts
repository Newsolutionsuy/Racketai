import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { readdir } from 'fs/promises';
import { join, basename } from 'path';
import { Analysis } from '../analysis/entities/analysis.entity';
import { UploadVideoDto } from './dto/upload-video.dto';
import { AnalyzeExistingVideoDto } from './dto/analyze-existing-video.dto';
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

  async getUploads(): Promise<string[]> {
    const uploadsPath = './uploads';
    try {
      const files = await readdir(uploadsPath);
      return files.filter((file) => file !== '.gitkeep');
    } catch (error) {
      console.error('Error reading uploads directory:', error);
      return [];
    }
  }

  async createFromExisting(
    dto: AnalyzeExistingVideoDto,
  ): Promise<{ videoId: string; status: 'uploaded' }> {
    const safeFilename = basename(dto.filename);
    const videoPath = join('uploads', safeFilename);

    const createdVideo = this.videosRepository.create({
      sport: dto.sport,
      stroke: dto.stroke,
      handedness: dto.handedness,
      view: dto.view,
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
