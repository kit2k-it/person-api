import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DateUtil } from '../../common/utils/date.util';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [
      tasks,
      goals,
      habits,
      notes,
      upcomingEvents,
      recentActivities,
    ] = await Promise.all([
      this.getTaskStats(userId),
      this.getGoalStats(userId),
      this.getHabitStats(userId),
      this.getNoteStats(userId),
      this.getUpcomingEvents(userId, 5),
      this.getRecentActivities(userId, 10),
    ]);

    return {
      tasks,
      goals,
      habits,
      notes,
      upcomingEvents,
      recentActivities,
      productivityScore: this.calculateProductivityScore(tasks, habits),
    };
  }

  async getTaskAnalytics(userId: string, dateRange: { startDate: Date; endDate: Date }) {
    const { startDate, endDate } = dateRange;

    const [
      completionRate,
      tasksByStatus,
      tasksByPriority,
      dailyCompletion,
    ] = await Promise.all([
      this.getTaskCompletionRate(userId, startDate, endDate),
      this.getTasksByStatus(userId),
      this.getTasksByPriority(userId),
      this.getDailyTaskCompletions(userId, startDate, endDate),
    ]);

    return {
      completionRate,
      tasksByStatus,
      tasksByPriority,
      dailyCompletion,
    };
  }

  async getHabitAnalytics(userId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalCheckIns,
      completionRate,
      topHabits,
      streakStats,
    ] = await Promise.all([
      this.prisma.habitCheckIn.count({
        where: {
          userId,
          date: { gte: startDate },
        },
      }),
      this.getHabitCompletionRate(userId, startDate, new Date()),
      this.getTopHabits(userId, 5),
      this.getStreakStats(userId),
    ]);

    return {
      totalCheckIns,
      completionRate,
      topHabits,
      streakStats,
    };
  }

  async getGoalProgress(userId: string) {
    const [
      goals,
      avgProgress,
      completedGoals,
      overdueGoals,
    ] = await Promise.all([
      this.prisma.goal.findMany({
        where: { userId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.goal.aggregate({
        where: { userId, deletedAt: null },
        _avg: { progress: true },
      }),
      this.prisma.goal.count({
        where: {
          userId,
          deletedAt: null,
          status: 'ACHIEVED',
        },
      }),
      this.prisma.goal.count({
        where: {
          userId,
          deletedAt: null,
          targetDate: { lt: new Date() },
          status: { not: 'ACHIEVED' },
        },
      }),
    ]);

    const total = goals.length;
    const completionRate = total > 0 ? (completedGoals / total) * 100 : 0;

    return {
      goals,
      avgProgress: avgProgress._avg.progress || 0,
      completedGoals,
      overdueGoals,
      completionRate,
    };
  }

  async getProductivityTrends(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    const months = period === 'year' ? 12 : period === 'month' ? 6 : 4;

    const trends = [];

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const [tasksCompleted, habitsCompleted, goalsAchieved] = await Promise.all([
        this.prisma.task.count({
          where: {
            userId,
            deletedAt: null,
            status: 'DONE',
            completedAt: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.habitCheckIn.count({
          where: {
            userId,
            date: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.goal.count({
          where: {
            userId,
            deletedAt: null,
            status: 'ACHIEVED',
            updatedAt: { gte: startDate, lte: endDate },
          },
        }),
      ]);

      trends.push({
        period: `${startDate.getMonth() + 1}/${startDate.getFullYear()}`,
        tasksCompleted,
        habitsCompleted,
        goalsAchieved,
        score: this.calculateProductivityScore(
          { completedThisMonth: tasksCompleted },
          { totalCompletions: habitsCompleted },
        ),
      });
    }

    return trends;
  }

  private async getTaskStats(userId: string) {
    const [
      total,
      completed,
      inProgress,
      overdue,
    ] = await Promise.all([
      this.prisma.task.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.task.count({
        where: { userId, deletedAt: null, status: 'DONE' },
      }),
      this.prisma.task.count({
        where: { userId, deletedAt: null, status: 'IN_PROGRESS' },
      }),
      this.prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
    ]);

    return {
      total,
      completed,
      inProgress,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  private async getGoalStats(userId: string) {
    const [
      total,
      achieved,
      inProgress,
      avgProgress,
    ] = await Promise.all([
      this.prisma.goal.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.goal.count({
        where: { userId, deletedAt: null, status: 'ACHIEVED' },
      }),
      this.prisma.goal.count({
        where: { userId, deletedAt: null, status: 'IN_PROGRESS' },
      }),
      this.prisma.goal.aggregate({
        where: { userId, deletedAt: null },
        _avg: { progress: true },
      }),
    ]);

    return {
      total,
      achieved,
      inProgress,
      avgProgress: avgProgress._avg.progress || 0,
    };
  }

  private async getHabitStats(userId: string) {
    const [
      total,
      active,
      totalCompletions,
      avgStreak,
    ] = await Promise.all([
      this.prisma.habit.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.habit.count({
        where: { userId, deletedAt: null, isActive: true },
      }),
      this.prisma.habit.aggregate({
        where: { userId, deletedAt: null },
        _sum: { totalCompletions: true },
      }),
      this.prisma.habit.aggregate({
        where: { userId, deletedAt: null, isActive: true },
        _avg: { streakCount: true },
      }),
    ]);

    return {
      total,
      active,
      totalCompletions: totalCompletions._sum.totalCompletions || 0,
      avgStreak: avgStreak._avg.streakCount || 0,
    };
  }

  private async getNoteStats(userId: string) {
    const [
      total,
      favorites,
      pinned,
    ] = await Promise.all([
      this.prisma.note.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.note.count({
        where: { userId, deletedAt: null, isFavorite: true },
      }),
      this.prisma.note.count({
        where: { userId, deletedAt: null, isPinned: true },
      }),
    ]);

    return {
      total,
      favorites,
      pinned,
    };
  }

  private async getUpcomingEvents(userId: string, limit: number) {
    const now = new Date();
    return this.prisma.schedule.findMany({
      where: {
        userId,
        deletedAt: null,
        startDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        type: true,
        color: true,
      },
    });
  }

  private async getRecentActivities(userId: string, limit: number) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        action: true,
        resource: true,
        createdAt: true,
        details: true,
      },
    });
  }

  private async getTaskCompletionRate(userId: string, startDate: Date, endDate: Date) {
    const total = await this.prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const completed = await this.prisma.task.count({
      where: {
        userId,
        deletedAt: null,
        status: 'DONE',
        completedAt: { gte: startDate, lte: endDate },
      },
    });

    return total > 0 ? (completed / total) * 100 : 0;
  }

  private async getTasksByStatus(userId: string) {
    return this.prisma.task.groupBy({
      by: ['status'],
      where: { userId, deletedAt: null },
      _count: { status: true },
    });
  }

  private async getTasksByPriority(userId: string) {
    return this.prisma.task.groupBy({
      by: ['priority'],
      where: { userId, deletedAt: null },
      _count: { priority: true },
    });
  }

  private async getDailyTaskCompletions(userId: string, startDate: Date, endDate: Date) {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        userId,
        deletedAt: null,
        status: 'DONE',
        completedAt: { gte: startDate, lte: endDate },
      },
      select: {
        completedAt: true,
      },
    });

    // Group by date
    const daily = new Map<string, number>();
    completedTasks.forEach((task) => {
      const date = DateUtil.format(new Date(task.completedAt!), 'YYYY-MM-DD');
      daily.set(date, (daily.get(date) || 0) + 1);
    });

    return Array.from(daily.entries()).map(([date, count]) => ({ date, count }));
  }

  private async getHabitCompletionRate(userId: string, startDate: Date, endDate: Date) {
    // Get all active habits
    const habits = await this.prisma.habit.findMany({
      where: { userId, deletedAt: null, isActive: true },
    });

    if (habits.length === 0) return 0;

    let totalPossibleDays = 0;
    let totalCheckIns = 0;

    for (const habit of habits) {
      const checkIns = await this.prisma.habitCheckIn.count({
        where: {
          habitId: habit.id,
          userId,
          date: { gte: startDate, lte: endDate },
        },
      });

      const daysInPeriod = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      totalPossibleDays += daysInPeriod * habit.targetCount;
      totalCheckIns += checkIns;
    }

    return totalPossibleDays > 0 ? (totalCheckIns / totalPossibleDays) * 100 : 0;
  }

  private async getTopHabits(userId: string, limit: number) {
    return this.prisma.habit.findMany({
      where: { userId, deletedAt: null, isActive: true },
      orderBy: { streakCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        streakCount: true,
        totalCompletions: true,
        completionRate: true,
        frequency: true,
      },
    });
  }

  private async getStreakStats(userId: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId, deletedAt: null, isActive: true },
      select: {
        streakCount: true,
        longestStreak: true,
      },
    });

    const avgStreak = habits.reduce((sum, h) => sum + h.streakCount, 0) / (habits.length || 1);
    const maxStreak = Math.max(...habits.map((h) => h.streakCount), 0);
    const totalActiveHabits = habits.length;

    return {
      avgStreak: Math.round(avgStreak * 10) / 10,
      maxStreak,
      totalActiveHabits,
    };
  }

  private calculateProductivityScore(tasks: any, habits: any): number {
    // Simple productivity score based on task completion and habit engagement
    const taskScore = tasks.completedThisMonth ? (tasks.completedThisMonth / 30) * 40 : 0; // Max 40 points
    const habitScore = habits.totalCompletions ? Math.min(habits.totalCompletions / 30, 1) * 30 : 0; // Max 30 points
    const consistencyScore = 30; // Placeholder - calculate from streaks, routine adherence

    return Math.round(taskScore + habitScore + consistencyScore);
  }
}