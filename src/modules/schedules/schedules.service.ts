import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createEventDto: CreateEventDto) {
    const event = await this.prisma.schedule.create({
      data: {
        ...createEventDto,
        userId,
      },
    });

    return event;
  }

  async findAll(userId: string, query: EventQueryDto) {
    const { startDate, endDate, type, category, sortBy = 'startDate', sortOrder = 'asc', page = 1, limit = 20 } = query;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    if (sortBy !== 'startDate') {
      orderBy.startDate = 'asc';
    }

    const result = await PaginationUtil.paginate(
      this.prisma.schedule.findMany({
        where,
        orderBy,
      }),
      page,
      limit,
    );

    return result;
  }

  async findOne(userId: string, eventId: string) {
    const event = await this.prisma.schedule.findFirst({
      where: {
        id: eventId,
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

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(userId: string, eventId: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.schedule.updateMany({
      where: {
        id: eventId,
        userId,
        deletedAt: null,
      },
      data: {
        ...updateEventDto,
        updatedAt: new Date(),
      },
    });

    if (event.count === 0) {
      throw new NotFoundException('Event not found');
    }

    return this.findOne(userId, eventId);
  }

  async remove(userId: string, eventId: string) {
    const event = await this.prisma.schedule.updateMany({
      where: {
        id: eventId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (event.count === 0) {
      throw new NotFoundException('Event not found');
    }

    return { success: true, message: 'Event deleted successfully' };
  }

  async getUpcomingEvents(userId: string, limit: number = 10) {
    const now = new Date();
    const events = await this.prisma.schedule.findMany({
      where: {
        userId,
        deletedAt: null,
        startDate: { gte: now },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: limit,
    });

    return events;
  }

  async getEventsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const events = await this.prisma.schedule.findMany({
      where: {
        userId,
        deletedAt: null,
        OR: [
          {
            startDate: { gte: startDate, lte: endDate },
          },
          {
            endDate: { gte: startDate, lte: endDate },
          },
          {
            startDate: { lte: startDate },
            endDate: { gte: endDate },
          },
        ],
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return events;
  }

  async detectConflicts(userId: string, startDate: Date, endDate: Date, excludeEventId?: string) {
    const where: any = {
      userId,
      deletedAt: null,
      OR: [
        {
          startDate: { lt: endDate, gte: startDate },
        },
        {
          endDate: { gt: startDate, lte: endDate },
        },
        {
          startDate: { lte: startDate },
          endDate: { gte: endDate },
        },
      ],
    };

    if (excludeEventId) {
      where.id = { not: excludeEventId };
    }

    const conflicts = await this.prisma.schedule.findMany({
      where,
      take: 5,
    });

    return conflicts;
  }
}