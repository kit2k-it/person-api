import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { TaskAnalyticsQueryDto } from './dto/task-analytics-query.dto';
import { HabitAnalyticsQueryDto } from './dto/habit-analytics-query.dto';
import { ProductivityTrendsQueryDto } from './dto/productivity-trends-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview' })
  async getOverview(@CurrentUser() user: any) {
    const overview = await this.dashboardService.getOverview(user.id);
    return ApiResponseDto.success(overview);
  }

  @Get('tasks-analytics')
  @ApiOperation({ summary: 'Get task analytics' })
  async getTaskAnalytics(
    @CurrentUser() user: any,
    @Query() query: TaskAnalyticsQueryDto,
  ) {
    const analytics = await this.dashboardService.getTaskAnalytics(user.id, {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });
    return ApiResponseDto.success(analytics);
  }

  @Get('habits-analytics')
  @ApiOperation({ summary: 'Get habit analytics' })
  async getHabitAnalytics(
    @CurrentUser() user: any,
    @Query() query: HabitAnalyticsQueryDto,
  ) {
    const analytics = await this.dashboardService.getHabitAnalytics(
      user.id,
      query.days || 30,
    );
    return ApiResponseDto.success(analytics);
  }

  @Get('goals-progress')
  @ApiOperation({ summary: 'Get goals progress' })
  async getGoalProgress(@CurrentUser() user: any) {
    const progress = await this.dashboardService.getGoalProgress(user.id);
    return ApiResponseDto.success(progress);
  }

  @Get('productivity-trends')
  @ApiOperation({ summary: 'Get productivity trends' })
  async getProductivityTrends(
    @CurrentUser() user: any,
    @Query() query: ProductivityTrendsQueryDto,
  ) {
    const trends = await this.dashboardService.getProductivityTrends(
      user.id,
      query.period || 'month',
    );
    return ApiResponseDto.success(trends);
  }
}
