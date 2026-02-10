import { IsIn, IsOptional, IsString } from 'class-validator';
import { Handedness, Stroke, View } from '../entities/video.entity';

export class ProcessExistingVideoDto {
  @IsString()
  filename!: string;

  @IsString()
  sport!: string;

  @IsIn(['forehand', 'backhand'])
  stroke!: Stroke;

  @IsIn(['right', 'left'])
  handedness!: Handedness;

  @IsOptional()
  @IsIn(['side', 'front'])
  view?: View;
}
