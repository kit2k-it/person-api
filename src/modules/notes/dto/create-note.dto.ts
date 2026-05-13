import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  content: string; // Markdown content

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  parentNoteId?: string;
}