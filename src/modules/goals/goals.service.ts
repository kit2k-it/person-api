import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { TaskQueryDto } from '../tasks/dto/task-query.dto';
import { GoalStatus } from '../../common/enums/goal-status.enum';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    const goal = await this.prisma.goal.create({
      data: {
        ...createGoalDto,
        userId,
      },
    });

    return goal;
  }

  async findAll(userId: string, query: any = {}) {
    const { status, category, priority, page = 1, limit = 20 } = query;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (priority) where.priority = priority;

    const result = await PaginationUtil.paginate(
      this.prisma.goal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      page,
      limit,
    );

    return result;
  }

  async findOne(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
        deletedAt: null,
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return goal;
  }

  async update(userId: string, goalId: string, updateGoalDto: UpdateGoalDto) {
    const goal = await this.prisma.goal.updateMany({
      where: {
        id: goalId,
        userId,
        deletedAt: null,
      },
      data: updateGoalDto,
    });

    if (goal.count === 0) {
      throw new NotFoundException('Goal not found');
    }

    return this.findOne(userId, goalId);
  }

  async remove(userId: string, goalId: string) {
    const goal = await this.prisma.goal.updateMany({
      where: {
        id: goalId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (goal.count === 0) {
      throw new NotFoundException('Goal not found');
    }

    return { success: true, message: 'Goal deleted successfully' };
  }

  async updateProgress(userId: string, goalId: string, progress: number) {
    const goal = await this.prisma.goal.update({
      where: {
        id: goalId,
        userId,
        deletedAt: null,
      },
      data: {
        progress: Math.min(100, Math.max(0, progress)),
        status: progress >= 100 ? GoalStatus.ACHIEVED : GoalStatus.IN_PROGRESS,
        completedAt: progress >= 100 ? new Date() : null,
      },
    });

    return goal;
  }

  async addMilestone(
    userId: string,
    goalId: string,
    createMilestoneDto: CreateMilestoneDto,
  ) {
    // Verify goal exists and belongs to user
    const goal = await this.findOne(userId, goalId);

    const milestone = await this.prisma.milestone.create({
      data: {
        ...createMilestoneDto,
        goalId,
      },
    });

    return milestone;
  }

  async updateMilestone(
    userId: string,
    goalId: string,
    milestoneId: string,
    updateMilestoneDto: UpdateMilestoneDto,
  ) {
    // Verify milestone belongs to goal
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        goalId,
        goal: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: updateMilestoneDto,
    });

    return updated;
  }

  async deleteMilestone(userId: string, goalId: string, milestoneId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        goalId,
        goal: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    await this.prisma.milestone.delete({
      where: { id: milestoneId },
    });

    return { success: true, message: 'Milestone deleted successfully' };
  }

  async getStats(userId: string) {
    const [
      total,
      byStatus,
      avgProgress,
      completed,
      overdue,
    ] = await Promise.all([
      this.prisma.goal.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.goal.groupBy({
        by: ['status'],
        where: { userId, deletedAt: null },
        _count: { status: true },
      }),
      this.prisma.goal.aggregate({
        where: { userId, deletedAt: null },
        _avg: { progress: true },
      }),
      this.prisma.goal.count({
        where: {
          userId,
          deletedAt: null,
          status: GoalStatus.ACHIEVED,
        },
      }),
      this.prisma.goal.count({
        where: {
          userId,
          deletedAt: null,
          targetDate: { lt: new Date() },
          status: { not: GoalStatus.ACHIEVED },
        },
      }),
    ]);

    return {
      total,
      byStatus,
      avgProgress: avgProgress._avg.progress || 0,
      completed,
      overdue,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}