import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { ScheduleType } from '../../../common/enums/schedule-type.enum';
import { SchedulePriority } from '../../../common/enums/schedule-priority.enum';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(ScheduleType)
  type?: ScheduleType;

  @IsDateString()
  startDate: string;

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
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  recurrence?: string; // JSON string

  @IsString()
  @IsOptional()
  reminder?: string; // JSON string

  @IsOptional()
  @IsEnum(SchedulePriority)
  priority?: SchedulePriority;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}