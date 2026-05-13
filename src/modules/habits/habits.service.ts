import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CheckInDto } from './dto/check-in.dto';
import { DateUtil } from '../../common/utils/date.util';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { HabitFrequency } from '../../common/enums/habit-frequency.enum';

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createHabitDto: CreateHabitDto) {
    const habit = await this.prisma.habit.create({
      data: {
        ...createHabitDto,
        userId,
        frequency: createHabitDto.frequency || HabitFrequency.DAILY,
        startDate: new Date(),
      },
    });

    return habit;
  }

  async findAll(userId: string, query: any = {}) {
    const { isActive, category, frequency, page = 1, limit = 20 } = query;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }
    if (frequency) {
      where.frequency = frequency;
    }

    const result = await PaginationUtil.paginate(
      this.prisma.habit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      page,
      limit,
    );

    return result;
  }

  async findOne(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: {
        id: habitId,
        userId,
        deletedAt: null,
      },
      include: {
        checkIns: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }

  async update(userId: string, habitId: string, updateHabitDto: UpdateHabitDto) {
    const habit = await this.prisma.habit.updateMany({
      where: {
        id: habitId,
        userId,
        deletedAt: null,
      },
      data: {
        ...updateHabitDto,
        updatedAt: new Date(),
      },
    });

    if (habit.count === 0) {
      throw new NotFoundException('Habit not found');
    }

    return this.findOne(userId, habitId);
  }

  async remove(userId: string, habitId: string) {
    const habit = await this.prisma.habit.updateMany({
      where: {
        id: habitId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (habit.count === 0) {
      throw new NotFoundException('Habit not found');
    }

    return { success: true, message: 'Habit deleted successfully' };
  }

  async checkIn(userId: string, habitId: string, checkInDto: CheckInDto) {
    // Verify habit exists and belongs to user
    const habit = await this.findOne(userId, habitId);

    const checkInDate = new Date(checkInDto.date);
    const normalizedDate = DateUtil.startOfDay(checkInDate);

    // Check if already checked in today
    const existing = await this.prisma.habitCheckIn.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: normalizedDate,
        },
      },
    });

    let checkIn;
    if (existing) {
      // Update existing check-in
      checkIn = await this.prisma.habitCheckIn.update({
        where: { id: existing.id },
        data: {
          completedAt: checkInDto.count && checkInDto.count > 0 ? new Date() : null,
          notes: checkInDto.notes,
          count: checkInDto.count || existing.count,
        },
      });
    } else {
      // Create new check-in
      checkIn = await this.prisma.habitCheckIn.create({
        data: {
          habitId,
          userId,
          date: normalizedDate,
          completedAt: checkInDto.count && checkInDto.count > 0 ? new Date() : null,
          notes: checkInDto.notes,
          count: checkInDto.count || 1,
        },
      });
    }

    // Update habit stats
    await this.recalculateHabitStats(habitId);

    return checkIn;
  }

  async getCheckIns(userId: string, habitId: string, query: any = {}) {
    const { startDate, endDate, page = 1, limit = 30 } = query;

    const where: any = {
      habitId,
      userId,
    };

    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const result = await PaginationUtil.paginate(
      this.prisma.habitCheckIn.findMany({
        where,
        orderBy: { date: 'desc' },
      }),
      page,
      limit,
    );

    return result;
  }

  async recalculateHabitStats(habitId: string) {
    // Get all check-ins in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checkIns = await this.prisma.habitCheckIn.findMany({
      where: {
        habitId,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate streak
    let streakCount = 0;
    let longestStreak = 0;
    let currentStreak = 0;

    const today = DateUtil.startOfDay(new Date());
    const sortedDates = checkIns
      .map((ci) => DateUtil.startOfDay(ci.date))
      .sort((a, b) => b.getTime() - a.getTime());

    // Calculate current streak
    if (sortedDates.length > 0) {
      const firstDate = sortedDates[0];
      const diffDays = DateUtil.getDaysBetween(firstDate, today);

      if (diffDays === 0) {
        // Today is checked
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const expectedDate = DateUtil.addDays(firstDate, -i);
          if (
            sortedDates[i].getDate() === expectedDate.getDate() &&
            sortedDates[i].getMonth() === expectedDate.getMonth() &&
            sortedDates[i].getFullYear() === expectedDate.getFullYear()
          ) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    streakCount = currentStreak;

    // Calculate longest streak (simplified - only consecutive days with any check-in)
    // In production, you might want a more sophisticated algorithm
    longestStreak = streakCount;

    // Calculate completion rate
    const totalCompletions = checkIns.reduce((sum, ci) => sum + ci.count, 0);
    const targetCount = (await this.prisma.habit.findUnique({ where: { id: habitId } }))?.targetCount || 1;
    const daysWithTargetMet = checkIns.filter(ci => ci.count >= targetCount).length;
    const totalDays = 30; // Last 30 days
    const completionRate = (daysWithTargetMet / totalDays) * 100;

    // Update habit
    await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        streakCount,
        longestStreak,
        totalCompletions,
        completionRate: Math.round(completionRate * 10) / 10,
      },
    });
  }

  async getStats(userId: string) {
    const [
      total,
      active,
      byFrequency,
      avgStreak,
      totalCompletions,
    ] = await Promise.all([
      this.prisma.habit.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.habit.count({
        where: { userId, deletedAt: null, isActive: true },
      }),
      this.prisma.habit.groupBy({
        by: ['frequency'],
        where: { userId, deletedAt: null },
        _count: { frequency: true },
      }),
      this.prisma.habit.aggregate({
        where: { userId, deletedAt: null, isActive: true },
        _avg: { streakCount: true },
      }),
      this.prisma.habit.aggregate({
        where: { userId, deletedAt: null },
        _sum: { totalCompletions: true },
      }),
    ]);

    return {
      total,
      active,
      byFrequency,
      avgStreak: avgStreak._avg.streakCount || 0,
      totalCompletions: totalCompletions._sum.totalCompletions || 0,
    };
  }
}