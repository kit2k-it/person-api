import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class HabitAnalyticsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number;
}
