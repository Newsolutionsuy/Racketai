import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

interface AnalyzeInput {
  videoPath: string;
  sport: string;
  stroke: string;
  handedness: string;
  view?: string;
}

export interface StrokeMetrics {
  contact_timing: 'early' | 'late' | 'ok';
  hip_rotation: 'low' | 'ok' | 'good';
  shoulder_hip_separation: 'low' | 'ok';
  balance: 'stable' | 'unstable';
}

interface AnalyzeOutput {
  summary: string;
  details: string;
  metrics: StrokeMetrics;
  analyzedBy?: string;
  couldNotUseAIReason?: string | null;
}

@Injectable()
export class AnalysisClientService {
  private readonly analysisApiUrl: string;
  private readonly analysisApiTimeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.analysisApiUrl = this.configService.get<string>(
      'ANALYSIS_API_URL',
      'http://localhost:8000/analyze',
    );
    this.analysisApiTimeoutMs = this.getTimeoutMs();
  }

  async analyzeVideo(payload: AnalyzeInput): Promise<AnalyzeOutput> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<AnalyzeOutput>(this.analysisApiUrl, payload, {
          timeout: this.analysisApiTimeoutMs,
        }),
      );

      return data;
    } catch (error) {
      throw new Error(this.toFriendlyErrorMessage(error));
    }
  }

  private toFriendlyErrorMessage(error: unknown): string {
    if (!isAxiosError(error)) {
      if (error instanceof Error) {
        return `Unexpected analysis client error: ${error.message}`;
      }

      return 'Unexpected analysis client error';
    }

    if (error.code === 'ECONNABORTED') {
      return `Analysis service timeout after ${this.analysisApiTimeoutMs}ms (${this.analysisApiUrl})`;
    }

    if (error.code === 'ECONNREFUSED') {
      return `Cannot connect to analysis service (${this.analysisApiUrl}). Is it running?`;
    }

    const status = error.response?.status;
    const responseData = error.response?.data as
      | { detail?: string; message?: string | string[] }
      | undefined;

    if (status) {
      const detail = this.readDetail(responseData);
      return detail
        ? `Analysis service returned ${status}: ${detail}`
        : `Analysis service returned ${status}`;
    }

    if (error.message) {
      return `Analysis service request failed: ${error.message}`;
    }

    return 'Analysis service request failed';
  }

  private readDetail(payload?: {
    detail?: string;
    message?: string | string[];
  }): string | null {
    if (!payload) {
      return null;
    }

    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail.trim();
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (Array.isArray(payload.message) && payload.message.length > 0) {
      return payload.message.join('; ');
    }

    return null;
  }

  private getTimeoutMs(): number {
    const rawValue = this.configService.get<string>('ANALYSIS_API_TIMEOUT_MS', '120000');
    const parsed = Number(rawValue);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 120_000;
    }

    return Math.floor(parsed);
  }
}
