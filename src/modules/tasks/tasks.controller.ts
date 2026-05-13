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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { BulkUpdateTaskDto } from './dto/bulk-update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@CurrentUser() user: any, @Body() createTaskDto: CreateTaskDto) {
    const task = await this.tasksService.create(user.id, createTaskDto);
    return ApiResponseDto.success(task, 'Task created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  async findAll(@CurrentUser() user: any, @Query() query: TaskQueryDto) {
    const tasks = await this.tasksService.findAll(user.id, query);
    return ApiResponseDto.success(tasks);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats(@CurrentUser() user: any) {
    const stats = await this.tasksService.getStats(user.id);
    return ApiResponseDto.success(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') taskId: string) {
    const task = await this.tasksService.findOne(user.id, taskId);
    return ApiResponseDto.success(task);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  async update(
    @CurrentUser() user: any,
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.update(user.id, taskId, updateTaskDto);
    return ApiResponseDto.success(task, 'Task updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  async remove(@CurrentUser() user: any, @Param('id') taskId: string) {
    const result = await this.tasksService.remove(user.id, taskId);
    return ApiResponseDto.success(result.message);
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Bulk update tasks' })
  async bulkUpdate(
    @CurrentUser() user: any,
    @Body() bulkUpdateTaskDto: BulkUpdateTaskDto,
  ) {
    const result = await this.tasksService.bulkUpdate(user.id, bulkUpdateTaskDto);
    return ApiResponseDto.success(result);
  }
}