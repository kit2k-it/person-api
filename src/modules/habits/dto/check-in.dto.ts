import { IsDateString, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  count?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}