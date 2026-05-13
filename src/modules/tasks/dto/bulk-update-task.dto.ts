import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { TaskStatus } from '../../../common/enums/task-status.enum';

export class BulkUpdateTaskDto {
  @IsArray()
  taskIds: string[];

  @IsOptional()
  @IsString()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString()
  project?: string;
}