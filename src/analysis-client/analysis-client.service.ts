import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface AnalyzeInput {
  videoPath: string;
  sport: string;
  stroke: string;
  handedness: string;
  view?: string;
}

interface AnalyzeOutput {
  summary: string;
  details: string;
  analyzedBy: string;
  couldNotUseAIReason?: string | null;
}

@Injectable()
export class AnalysisClientService {
  private readonly analysisApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.analysisApiUrl = this.configService.get<string>(
      'ANALYSIS_API_URL',
      'http://localhost:8000/analyze',
    );
  }

  async analyzeVideo(payload: AnalyzeInput): Promise<AnalyzeOutput> {
    const { data } = await firstValueFrom(
      this.httpService.post<AnalyzeOutput>(this.analysisApiUrl, payload, {
        timeout: 10_000,
      }),
    );

    return data;
  }
}
