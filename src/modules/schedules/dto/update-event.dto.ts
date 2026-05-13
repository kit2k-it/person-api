import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ScheduleType } from '../../../common/enums/schedule-type.enum';
import { SchedulePriority } from '../../../common/enums/schedule-priority.enum';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  recurrence?: string;

  @IsString()
  @IsOptional()
  reminder?: string;

  @IsString()
  @IsOptional()
  @IsEnum(SchedulePriority)
  priority?: SchedulePriority;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}