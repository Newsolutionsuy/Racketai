import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Analysis } from '../analysis/entities/analysis.entity';
import { AnalysisClientModule } from '../analysis-client/analysis-client.module';
import { Video } from './entities/video.entity';
import { VideosController } from './videos.controller';
import { VideosProcessor } from './videos.processor';
import { VideosService } from './videos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, Analysis]),
    BullModule.registerQueue({ name: 'video-analysis' }),
    AnalysisClientModule,
  ],
  controllers: [VideosController],
  providers: [VideosService, VideosProcessor],
  exports: [VideosService],
})
export class VideosModule {}
