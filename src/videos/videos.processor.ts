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
      });

      await this.videosService.saveAnalysis(videoId, analysis.summary, analysis.details);
    } catch (_error) {
      await this.videosService.markAsFailed(videoId);
      throw _error;
    }
  }
}
