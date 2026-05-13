import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        locale: true,
        emailVerified: true,
        role: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        locale: true,
        emailVerified: true,
        role: true,
        preferences: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async uploadAvatar(userId: string, uploadAvatarDto: UploadAvatarDto) {
    // In production, you would upload to S3 or Cloudinary
    // For now, we'll just store the URL or base64

    let avatarUrl: string;

    if (uploadAvatarDto.url) {
      avatarUrl = uploadAvatarDto.url;
    } else if (uploadAvatarDto.base64) {
      // Save base64 to file or upload to cloud storage
      // For demo, we'll just store the base64 string
      avatarUrl = uploadAvatarDto.base64;
    } else {
      throw new BadRequestException('Either url or base64 must be provided');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updateSettings(userId: string, updateSettingsDto: UpdateSettingsDto) {
    // Parse preferences JSON if provided
    let preferences = undefined;
    if (updateSettingsDto.preferences) {
      try {
        preferences = JSON.parse(updateSettingsDto.preferences);
      } catch (error) {
        throw new BadRequestException('Invalid JSON in preferences');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateSettingsDto,
        preferences,
      },
      select: {
        id: true,
        timezone: true,
        locale: true,
        role: true,
        preferences: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async softDelete(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return user;
  }
}