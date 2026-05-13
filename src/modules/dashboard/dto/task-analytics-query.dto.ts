import { IsString } from 'class-validator';

export class TaskAnalyticsQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}
