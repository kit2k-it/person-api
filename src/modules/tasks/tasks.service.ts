import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { TaskStatus } from '../../generated/prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTaskDto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        userId,
        tags: createTaskDto.tags || [],
      },
    });

    return task;
  }

  async findAll(userId: string, query: TaskQueryDto) {
    const { search, status, priority, dueDateFrom, dueDateTo, tags, project, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = query;

    // Build where clause
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
        where.dueDate.gte = new Date(dueDateFrom);
      }
      if (dueDateTo) {
        where.dueDate.lte = new Date(dueDateTo);
      }
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (project) {
      where.project = { contains: project, mode: 'insensitive' };
    }

    // Build order
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const result = await PaginationUtil.paginate(
      this.prisma.task.findMany({
        where,
        orderBy,
      }),
      page,
      limit,
    );

    return result;
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
        deletedAt: null,
      },
      include: {
        activities: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(userId: string, taskId: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.updateMany({
      where: {
        id: taskId,
        userId,
        deletedAt: null,
      },
      data: {
        ...updateTaskDto,
        updatedAt: new Date(),
      },
    });

    if (task.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return this.findOne(userId, taskId);
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.updateMany({
      where: {
        id: taskId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (task.count === 0) {
      throw new NotFoundException('Task not found');
    }

    return { success: true, message: 'Task deleted successfully' };
  }

  async bulkUpdate(userId: string, bulkUpdateTaskDto: BulkUpdateTaskDto) {
    const { taskIds, status, isArchived, project } = bulkUpdateTaskDto;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (isArchived !== undefined) {
      updateData.deletedAt = isArchived ? new Date() : null;
    }
    if (project) updateData.project = project;

    const result = await this.prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        userId,
      },
      data: updateData,
    });

    return {
      success: true,
      message: `${result.count} task(s) updated`,
      count: result.count,
    };
  }

  async getStats(userId: string) {
    const [
      total,
      byStatus,
      byPriority,
      overdue,
      completedThisWeek,
      completedThisMonth,
    ] = await Promise.all([
      this.prisma.task.count({
        where: { userId, deletedAt: null },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { userId, deletedAt: null },
        _count: { status: true },
      }),
      this.prisma.task.groupBy({
        by: ['priority'],
        where: { userId, deletedAt: null },
        _count: { priority: true },
      }),
      this.prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
      this.prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: TaskStatus.DONE,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.task.count({
        where: {
          userId,
          deletedAt: null,
          status: TaskStatus.DONE,
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      completedThisWeek,
      completedThisMonth,
    };
  }
}