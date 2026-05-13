import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Schedules')
@Controller('schedules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  async create(@CurrentUser() user: any, @Body() createEventDto: CreateEventDto) {
    // Check for conflicts
    const conflicts = await this.schedulesService.detectConflicts(
      user.id,
      new Date(createEventDto.startDate),
      createEventDto.endDate ? new Date(createEventDto.endDate) : new Date(createEventDto.startDate),
    );

    if (conflicts.length > 0) {
      return ApiResponseDto.success(
        { conflicts },
        'Event created with scheduling conflicts',
      );
    }

    const event = await this.schedulesService.create(user.id, createEventDto);
    return ApiResponseDto.success(event, 'Event created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  async findAll(@CurrentUser() user: any, @Query() query: EventQueryDto) {
    const events = await this.schedulesService.findAll(user.id, query);
    return ApiResponseDto.success(events);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  async getUpcoming(@CurrentUser() user: any, @Query('limit') limit: number = 10) {
    const events = await this.schedulesService.getUpcomingEvents(user.id, limit);
    return ApiResponseDto.success(events);
  }

  @Get('range')
  @ApiOperation({ summary: 'Get events by date range' })
  async getByDateRange(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const events = await this.schedulesService.getEventsByDateRange(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
    return ApiResponseDto.success(events);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') eventId: string) {
    const event = await this.schedulesService.findOne(user.id, eventId);
    return ApiResponseDto.success(event);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update event' })
  async update(
    @CurrentUser() user: any,
    @Param('id') eventId: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    // Check for conflicts if dates are being updated
    if (updateEventDto.startDate || updateEventDto.endDate) {
      const existingEvent = await this.schedulesService.findOne(user.id, eventId);
      const startDate = updateEventDto.startDate ? new Date(updateEventDto.startDate) : existingEvent.startDate;
      const endDate = updateEventDto.endDate ? new Date(updateEventDto.endDate) : (existingEvent.endDate || startDate);

      const conflicts = await this.schedulesService.detectConflicts(
        user.id,
        startDate,
        endDate,
        eventId,
      );

      if (conflicts.length > 0) {
        return ApiResponseDto.success(
          { conflicts },
          'Event updated with scheduling conflicts',
        );
      }
    }

    const event = await this.schedulesService.update(user.id, eventId, updateEventDto);
    return ApiResponseDto.success(event, 'Event updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete event (soft delete)' })
  async remove(@CurrentUser() user: any, @Param('id') eventId: string) {
    const result = await this.schedulesService.remove(user.id, eventId);
    return ApiResponseDto.success(result.message);
  }
}