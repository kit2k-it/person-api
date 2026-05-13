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
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  async create(@CurrentUser() user: any, @Body() createGoalDto: CreateGoalDto) {
    const goal = await this.goalsService.create(user.id, createGoalDto);
    return ApiResponseDto.success(goal, 'Goal created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals' })
  async findAll(@CurrentUser() user: any, @Query() query: any) {
    const goals = await this.goalsService.findAll(user.id, query);
    return ApiResponseDto.success(goals);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get goal statistics' })
  async getStats(@CurrentUser() user: any) {
    const stats = await this.goalsService.getStats(user.id);
    return ApiResponseDto.success(stats);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') goalId: string) {
    const goal = await this.goalsService.findOne(user.id, goalId);
    return ApiResponseDto.success(goal);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update goal' })
  async update(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    const goal = await this.goalsService.update(user.id, goalId, updateGoalDto);
    return ApiResponseDto.success(goal, 'Goal updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete goal (soft delete)' })
  async remove(@CurrentUser() user: any, @Param('id') goalId: string) {
    const result = await this.goalsService.remove(user.id, goalId);
    return ApiResponseDto.success(result.message);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update goal progress' })
  async updateProgress(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Query('progress') progress: number,
  ) {
    const goal = await this.goalsService.updateProgress(user.id, goalId, progress);
    return ApiResponseDto.success(goal, 'Progress updated successfully');
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add milestone to goal' })
  async addMilestone(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Body() createMilestoneDto: CreateMilestoneDto,
  ) {
    const milestone = await this.goalsService.addMilestone(
      user.id,
      goalId,
      createMilestoneDto,
    );
    return ApiResponseDto.success(milestone, 'Milestone added successfully');
  }

  @Put('milestones/:milestoneId')
  @ApiOperation({ summary: 'Update milestone' })
  async updateMilestone(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    const milestone = await this.goalsService.updateMilestone(
      user.id,
      goalId,
      milestoneId,
      updateMilestoneDto,
    );
    return ApiResponseDto.success(milestone, 'Milestone updated successfully');
  }

  @Delete('milestones/:milestoneId')
  @ApiOperation({ summary: 'Delete milestone' })
  async deleteMilestone(
    @CurrentUser() user: any,
    @Param('id') goalId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    const result = await this.goalsService.deleteMilestone(
      user.id,
      goalId,
      milestoneId,
    );
    return ApiResponseDto.success(result.message);
  }
}