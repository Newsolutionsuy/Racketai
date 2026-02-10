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
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { UploadVideoDto } from './dto/upload-video.dto';
import { VideosService } from './videos.service';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

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
    analysis: { summary: string; details: string } | null;
  }> {
    return this.videosService.getVideoById(id);
  }
}
