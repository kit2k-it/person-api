import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UpdateSettingsDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  timezone?: string;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  locale?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  preferences?: string; // JSON string
}