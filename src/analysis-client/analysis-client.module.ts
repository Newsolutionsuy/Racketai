import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnalysisClientService } from './analysis-client.service';

@Module({
  imports: [HttpModule],
  providers: [AnalysisClientService],
  exports: [AnalysisClientService],
})
export class AnalysisClientModule {}
