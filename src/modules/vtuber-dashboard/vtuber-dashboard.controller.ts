import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VTuberDashboardService } from './vtuber-dashboard.service';
import { DashboardQueryDto, GachaAnalyticsDto, GenerateReportDto, RevenueAnalyticsDto, UserAnalyticsDto } from './dto/dashboard-query.dto';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard)
export class VTuberDashboardController {
  constructor(private readonly dashboardService: VTuberDashboardService) {}

  @Get('overview')
  async getDashboardOverview(@Request() req: any, @Query() queryDto: DashboardQueryDto) {
    const metrics = await this.dashboardService.getDashboardOverview(req.user.sub, queryDto);
    return {
      success: true,
      data: { metrics }
    };
  }

  @Get('metrics')
  async getDashboardMetrics(@Request() req: any, @Query() queryDto: DashboardQueryDto) {
    const vtuberId = queryDto.vtuberId || req.user.sub;
    const metrics = await this.dashboardService.getDashboardMetrics(req.user.sub, vtuberId, queryDto);
    return {
      success: true,
      data: { metrics }
    };
  }

  @Get('vtuber/:id')
  async getVTuberDashboard(@Request() req: any, @Param('id') vtuberId: string, @Query() queryDto: DashboardQueryDto) {
    const dashboard = await this.dashboardService.getDashboardMetrics(req.user.sub, vtuberId, queryDto);
    return {
      success: true,
      data: { dashboard }
    };
  }

  @Get('summary')
  async getDashboardSummary(@Request() req: any, @Query() queryDto: DashboardQueryDto) {
    const overview = await this.dashboardService.getDashboardOverview(req.user.sub, queryDto);
    const summary = {
      totalRevenue: overview.totalRevenue,
      totalUsers: overview.totalUsers,
      totalGachaPlays: overview.totalGachaPlays,
      revenueGrowth: overview.revenueGrowth
    };
    return {
      success: true,
      data: { summary }
    };
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(@Request() req: any, @Query() queryDto: RevenueAnalyticsDto) {
    const analytics = await this.dashboardService.getRevenueAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { analytics }
    };
  }

  @Get('analytics/revenue/trend')
  async getRevenueTrend(@Request() req: any, @Query() queryDto: RevenueAnalyticsDto) {
    const analytics = await this.dashboardService.getRevenueAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { trend: analytics.dailyBreakdown }
    };
  }

  @Get('analytics/revenue/breakdown')
  async getRevenueBreakdown(@Request() req: any, @Query() queryDto: RevenueAnalyticsDto) {
    const analytics = await this.dashboardService.getRevenueAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { breakdown: analytics.revenueBySource }
    };
  }

  @Get('analytics/revenue/comparison')
  async getRevenueComparison(@Request() req: any, @Query() queryDto: RevenueAnalyticsDto) {
    const analytics = await this.dashboardService.getRevenueAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { 
        current: analytics.totalRevenue,
        growth: analytics.growthRate,
        comparison: 'vs previous period'
      }
    };
  }

  @Get('analytics/gacha')
  async getGachaAnalytics(@Request() req: any, @Query() queryDto: GachaAnalyticsDto) {
    const analytics = await this.dashboardService.getGachaAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { analytics }
    };
  }

  @Get('analytics/gacha/performance')
  async getGachaPerformance(@Request() req: any, @Query() queryDto: GachaAnalyticsDto) {
    const analytics = await this.dashboardService.getGachaAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { performance: analytics.topGachas }
    };
  }

  @Get('analytics/gacha/items')
  async getGachaItems(@Request() req: any, @Query() queryDto: GachaAnalyticsDto) {
    const analytics = await this.dashboardService.getGachaAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { items: analytics.itemDistribution }
    };
  }

  @Get('analytics/users')
  async getUserAnalytics(@Request() req: any, @Query() queryDto: UserAnalyticsDto) {
    const analytics = await this.dashboardService.getUserAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { analytics }
    };
  }

  @Get('analytics/users/behavior')
  async getUserBehavior(@Request() req: any, @Query() queryDto: UserAnalyticsDto) {
    const analytics = await this.dashboardService.getUserAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { behavior: analytics.behavior }
    };
  }

  @Get('analytics/users/retention')
  async getUserRetention(@Request() req: any, @Query() queryDto: UserAnalyticsDto) {
    const analytics = await this.dashboardService.getUserAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { retention: analytics.retention }
    };
  }

  @Get('analytics/users/conversion')
  async getUserConversion(@Request() req: any, @Query() queryDto: UserAnalyticsDto) {
    const analytics = await this.dashboardService.getUserAnalytics(req.user.sub, queryDto);
    return {
      success: true,
      data: { conversion: analytics.conversion }
    };
  }

  @Post('reports/generate')
  async generateReport(@Request() req: any, @Body() reportDto: GenerateReportDto) {
    const report = await this.dashboardService.generateReport(req.user.sub, reportDto);
    return {
      success: true,
      data: { report }
    };
  }

  @Get('reports')
  async getReports(@Request() req: any, @Query() queryDto: DashboardQueryDto) {
    const result = await this.dashboardService.getReports(req.user.sub, queryDto);
    return {
      success: true,
      data: result
    };
  }

  @Get('reports/:id')
  async getReport(@Request() req: any, @Param('id') reportId: string) {
    const report = await this.dashboardService.getReport(req.user.sub, reportId);
    return {
      success: true,
      data: { report }
    };
  }

  @Delete('reports/:id')
  async deleteReport(@Request() req: any, @Param('id') reportId: string) {
    await this.dashboardService.deleteReport(req.user.sub, reportId);
    return {
      success: true,
      message: 'Report deleted successfully'
    };
  }
}