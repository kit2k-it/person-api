import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { HabitFrequency } from '../../../common/enums/habit-frequency.enum';

export class CreateHabitDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  frequency?: HabitFrequency;

  @IsInt()
  @Min(1)
  @IsOptional()
  targetCount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsDateString()
  @IsOptional()
  reminderAt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}