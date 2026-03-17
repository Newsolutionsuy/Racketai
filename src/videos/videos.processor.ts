import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalysisClientService } from '../analysis-client/analysis-client.service';
import { VideosService } from './videos.service';

@Processor('video-analysis')
export class VideosProcessor extends WorkerHost {
  constructor(
    private readonly videosService: VideosService,
    private readonly analysisClientService: AnalysisClientService,
  ) {
    super();
  }

  async process(job: Job<{ videoId: string }>): Promise<void> {
    const { videoId } = job.data;

    try {
      const video = await this.videosService.getVideoForAnalysis(videoId);
      const analysis = await this.analysisClientService.analyzeVideo({
        videoPath: video.videoPath,
        sport: video.sport,
        stroke: video.stroke,
        handedness: video.handedness,
        view: video.view,
      });

      await this.videosService.saveAnalysis(
        videoId,
        analysis.summary,
        analysis.details,
        analysis.metrics,
        analysis.analyzedBy ?? 'rules',
        analysis.couldNotUseAIReason ?? null,
      );
    } catch (error) {
      const failureReason = this.extractErrorMessage(error);
      await this.videosService.markAsFailed(videoId, failureReason);
      console.error(`[video-analysis:${videoId}] ${failureReason}`, error);
      throw error;
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error while analyzing the video';
  }
}
