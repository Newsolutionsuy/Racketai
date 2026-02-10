import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { readdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { ProcessExistingVideoDto } from './dto/process-existing-video.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get('uploads')
  async listUploads(): Promise<string[]> {
    const uploadsDir = './uploads';
    try {
      const files = readdirSync(uploadsDir);
      return files.filter((file) =>
        ['.mp4', '.mov'].includes(extname(file).toLowerCase()),
      );
    } catch (error) {
      return [];
    }
  }

  @Post('existing')
  async processExisting(
    @Body() body: ProcessExistingVideoDto,
  ): Promise<{ videoId: string; status: 'uploaded' }> {
    const videoPath = join('uploads', body.filename);
    return this.videosService.createVideo(body, videoPath);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_, file, cb) => {
        const allowed = ['.mp4', '.mov'];
        const extension = extname(file.originalname).toLowerCase();

        if (!allowed.includes(extension)) {
          cb(new BadRequestException('Only mp4 and mov files are allowed'), false);
          return;
        }

        cb(null, true);
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadVideoDto,
  ): Promise<{ videoId: string; status: 'uploaded' }> {
    if (!file) {
      throw new BadRequestException('Video file is required');
    }

    return this.videosService.createVideo(body, file.path);
  }

  @Get(':id')
  getVideoById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{
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
    return this.videosService.getVideoById(id);
  }
}
