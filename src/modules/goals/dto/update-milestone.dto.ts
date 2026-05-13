import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';

export class UpdateMilestoneDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}