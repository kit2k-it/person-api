import { IsString, IsOptional, IsInt, Min, Max, MaxLength, IsDateString, IsEnum } from 'class-validator';
import { GoalStatus } from '../../../common/enums/goal-status.enum';
import { GoalPriority } from '../../../common/enums/goal-priority.enum';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;
}