import { IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';

export class CreateMilestoneDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}