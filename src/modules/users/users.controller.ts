import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.usersService.findOne(user.id);
    return ApiResponseDto.success(profile);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, updateProfileDto);
    return ApiResponseDto.success(updated, 'Profile updated successfully');
  }

  @Put('avatar')
  @ApiOperation({ summary: 'Upload/update avatar' })
  async uploadAvatar(
    @CurrentUser() user: any,
    @Body() uploadAvatarDto: UploadAvatarDto,
  ) {
    const updated = await this.usersService.uploadAvatar(user.id, uploadAvatarDto);
    return ApiResponseDto.success(updated, 'Avatar updated successfully');
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user settings' })
  async updateSettings(
    @CurrentUser() user: any,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const updated = await this.usersService.updateSettings(
      user.id,
      updateSettingsDto,
    );
    return ApiResponseDto.success(updated, 'Settings updated successfully');
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('account')
  @ApiOperation({ summary: 'Soft delete user account' })
  async deleteAccount(@CurrentUser() user: any) {
    await this.usersService.softDelete(user.id);
    return ApiResponseDto.success(null, 'Account deleted successfully');
  }
}