import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadAvatarDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  url?: string;

  // For base64 encoded images
  @IsString()
  @IsOptional()
  base64?: string;
}