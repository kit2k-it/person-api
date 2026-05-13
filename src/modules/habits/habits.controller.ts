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
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CheckInDto } from './dto/check-in.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Habits')
@Controller('habits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit' })
  async create(@CurrentUser() user: any, @Body() createHabitDto: CreateHabitDto) {
    const habit = await this.habitsService.create(user.id, createHabitDto);
    return ApiResponseDto.success(habit, 'Habit created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all habits' })
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    const habits = await this.habitsService.findAll(user.id, query);
    return ApiResponseDto.success(habits);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get habit statistics' })
  async getStats(@CurrentUser() user: any) {
    const stats = await this.habitsService.getStats(user.id);
    return ApiResponseDto.success(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get habit by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') habitId: string) {
    const habit = await this.habitsService.findOne(user.id, habitId);
    return ApiResponseDto.success(habit);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update habit' })
  async update(
    @CurrentUser() user: any,
    @Param('id') habitId: string,
    @Body() updateHabitDto: UpdateHabitDto,
  ) {
    const habit = await this.habitsService.update(user.id, habitId, updateHabitDto);
    return ApiResponseDto.success(habit, 'Habit updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete habit (soft delete)' })
  async remove(@CurrentUser() user: any, @Param('id') habitId: string) {
    const result = await this.habitsService.remove(user.id, habitId);
    return ApiResponseDto.success(result.message);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in for a habit' })
  async checkIn(
    @CurrentUser() user: any,
    @Param('id') habitId: string,
    @Body() checkInDto: CheckInDto,
  ) {
    const checkIn = await this.habitsService.checkIn(user.id, habitId, checkInDto);
    return ApiResponseDto.success(checkIn, 'Check-in recorded successfully');
  }

  @Get(':id/check-ins')
  @ApiOperation({ summary: 'Get habit check-ins' })
  async getCheckIns(
    @CurrentUser() user: any,
    @Param('id') habitId: string,
    @Query() query: any,
  ) {
    const checkIns = await this.habitsService.getCheckIns(user.id, habitId, query);
    return ApiResponseDto.success(checkIns);
  }
}