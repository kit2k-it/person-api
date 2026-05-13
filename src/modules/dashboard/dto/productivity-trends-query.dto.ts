import { IsOptional, IsEnum } from 'class-validator';

export class ProductivityTrendsQueryDto {
  @IsOptional()
  @IsEnum(['week', 'month', 'year'])
  period?: 'week' | 'month' | 'year';
}
