import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { VTuberDashboard } from './entities/vtuber-dashboard.entity';
import { AnalyticsReport, PeriodType, ReportStatus, ReportType, ReportVisibility } from './entities/analytics-report.entity';
import { DashboardFilter, DashboardMetrics, ReportSummary } from './interfaces/dashboard-metrics.interface';
import { DashboardQueryDto, GachaAnalyticsDto, GenerateReportDto, RevenueAnalyticsDto, UserAnalyticsDto } from './dto/dashboard-query.dto';
import { 
  AnalyticsDataUnavailableException,
  DashboardDataNotFoundException,
  DataAggregationException,
  ReportAccessDeniedException,
  ReportGenerationFailedException,
  VTuberDataAccessException
} from './exceptions/vtuber-dashboard.exceptions';

@Injectable()
export class VTuberDashboardService {
  private readonly logger = new Logger(VTuberDashboardService.name);

  constructor(
    @InjectRepository(VTuberDashboard)
    private dashboardRepository: Repository<VTuberDashboard>,
    @InjectRepository(AnalyticsReport)
    private reportRepository: Repository<AnalyticsReport>,
  ) {}

  /**
   * Get dashboard overview with aggregated metrics
   * @param userId - ID of the requesting user
   * @param queryDto - Dashboard query parameters
   * @returns Promise<DashboardMetrics> - Aggregated dashboard metrics
   */
  async getDashboardOverview(userId: string, queryDto: DashboardQueryDto): Promise<DashboardMetrics> {
    this.logger.log(`Getting dashboard overview for user: ${userId}`);
    const filter = this.buildDashboardFilter(queryDto);
    
    // Mock implementation for now - in real implementation would aggregate from multiple sources
    const mockMetrics: DashboardMetrics = {
      totalRevenue: 150000,
      revenueGrowth: 15.5,
      revenueByPeriod: [
        { date: '2024-01-01', revenue: 50000, gachaRevenue: 30000, medalRevenue: 20000 },
        { date: '2024-02-01', revenue: 65000, gachaRevenue: 40000, medalRevenue: 25000 },
        { date: '2024-03-01', revenue: 75000, gachaRevenue: 45000, medalRevenue: 30000 }
      ],
      revenueByVTuber: [
        { vtuberId: 'vtuber-1', channelName: 'Channel A', totalRevenue: 80000, growth: 20, rank: 1 },
        { vtuberId: 'vtuber-2', channelName: 'Channel B', totalRevenue: 70000, growth: 10, rank: 2 }
      ],
      totalGachaPlays: 45000,
      gachaPlayGrowth: 25.0,
      gachaRevenueShare: 60.0,
      topPerformingGachas: [
        { gachaId: 'gacha-1', gachaName: 'Premium Gacha', totalPlays: 15000, revenue: 75000, conversionRate: 15.5, averageSpend: 50 }
      ],
      totalUsers: 8500,
      activeUsers: 6200,
      newUsers: 850,
      userRetention: { day1: 85, day7: 60, day30: 35, day90: 20 },
      totalRewardsDistributed: 1200,
      popularRewards: [
        { rewardId: 'reward-1', rewardName: 'Special Badge', distributionCount: 500, popularityScore: 95 }
      ],
      inventoryStatus: [
        { itemId: 'item-1', itemName: 'Limited Edition Card', currentStock: 100, reservedStock: 20, lowStockThreshold: 50, status: 'LOW_STOCK' }
      ]
    };
    
    return mockMetrics;
  }

  /**
   * Build dashboard filter from query parameters
   * @private
   * @param queryDto - Dashboard query DTO
   * @returns DashboardFilter - Built filter object
   */
  private buildDashboardFilter(queryDto: DashboardQueryDto): DashboardFilter {
    return {
      startDate: queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      endDate: queryDto.endDate ? new Date(queryDto.endDate) : undefined,
      vtuberId: queryDto.vtuberId,
      includeInactive: queryDto.includeInactive,
      groupBy: queryDto.groupBy
    };
  }

  /**
   * Get dashboard metrics for a specific VTuber
   * @param userId - ID of the requesting user
   * @param vtuberId - ID of the VTuber
   * @param queryDto - Dashboard query parameters
   * @returns Promise<VTuberDashboard> - VTuber dashboard data
   */
  async getDashboardMetrics(userId: string, vtuberId: string, queryDto: DashboardQueryDto): Promise<VTuberDashboard> {
    this.logger.log(`Getting dashboard metrics for VTuber: ${vtuberId}, requested by: ${userId}`);
    await this.validateVTuberAccess(userId, vtuberId, 'VTUBER');
    
    const filter = this.buildDashboardFilter(queryDto);
    const startDate = filter.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filter.endDate || new Date();
    
    // Try to find existing dashboard data
    let dashboard = await this.dashboardRepository.findOne({
      where: {
        vtuberId,
        periodStart: startDate,
        periodEnd: endDate
      }
    });
    
    if (!dashboard) {
      dashboard = await this.calculateDashboardMetrics(vtuberId, startDate, endDate);
    }
    
    return dashboard;
  }

  async getRevenueAnalytics(userId: string, queryDto: RevenueAnalyticsDto): Promise<any> {
    const vtuberId = queryDto.vtuberId;
    if (vtuberId) {
      await this.validateVTuberAccess(userId, vtuberId, 'VTUBER');
    }
    
    const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();
    
    return await this.aggregateRevenueData(vtuberId || '', startDate, endDate);
  }

  async getGachaAnalytics(userId: string, queryDto: GachaAnalyticsDto): Promise<any> {
    const vtuberId = queryDto.vtuberId;
    if (vtuberId) {
      await this.validateVTuberAccess(userId, vtuberId, 'VTUBER');
    }
    
    const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();
    
    return await this.aggregateGachaData(vtuberId || '', startDate, endDate);
  }

  async getUserAnalytics(userId: string, queryDto: UserAnalyticsDto): Promise<any> {
    const vtuberId = queryDto.vtuberId;
    if (vtuberId) {
      await this.validateVTuberAccess(userId, vtuberId, 'VTUBER');
    }
    
    const startDate = queryDto.startDate ? new Date(queryDto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : new Date();
    
    return await this.aggregateUserData(vtuberId || '', startDate, endDate);
  }

  /**
   * Generate an analytics report
   * @param userId - ID of the user generating the report
   * @param reportDto - Report generation parameters
   * @returns Promise<AnalyticsReport> - Generated report
   */
  async generateReport(userId: string, reportDto: GenerateReportDto): Promise<AnalyticsReport> {
    this.logger.log(`Generating report for user: ${userId}, type: ${reportDto.reportType}`);
    const vtuberId = reportDto.vtuberId;
    if (vtuberId) {
      await this.validateVTuberAccess(userId, vtuberId, 'VTUBER');
    }
    
    const startDate = new Date(reportDto.startDate);
    const endDate = new Date(reportDto.endDate);
    
    if (startDate >= endDate) {
      this.logger.error(`Invalid date range: ${reportDto.startDate} to ${reportDto.endDate}`);
      throw new BadRequestException('Start date must be before end date');
    }
    
    const report = this.reportRepository.create({
      reportType: reportDto.reportType as ReportType,
      vtuberId,
      periodType: reportDto.periodType as PeriodType,
      startDate,
      endDate,
      reportData: { placeholder: 'data' },
      summary: {
        totalRevenue: 100000,
        totalUsers: 5000,
        totalGachaPlays: 25000,
        keyInsights: ['Revenue increased by 15%'],
        performanceScore: 85
      },
      insights: ['Revenue growth is strong', 'User engagement is increasing'],
      recommendations: ['Focus on gacha promotion', 'Improve retention strategies'],
      status: ReportStatus.COMPLETED,
      generatedBy: userId,
      generatedAt: new Date(),
      visibility: (reportDto.visibility as ReportVisibility) || ReportVisibility.PRIVATE,
      sharedWith: reportDto.sharedWith || []
    });
    
    return await this.reportRepository.save(report);
  }

  async getReports(userId: string, queryDto: DashboardQueryDto): Promise<{ reports: AnalyticsReport[], total: number }> {
    const limit = queryDto.limit || 10;
    const offset = queryDto.offset || 0;
    
    const queryBuilder = this.reportRepository.createQueryBuilder('report')
      .where('report.generatedBy = :userId', { userId })
      .orderBy('report.generatedAt', 'DESC')
      .limit(limit)
      .offset(offset);
    
    const [reports, total] = await queryBuilder.getManyAndCount();
    
    return { reports, total };
  }

  async getReport(userId: string, reportId: string): Promise<AnalyticsReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId }
    });
    
    if (!report) {
      this.logger.warn(`Report not found: ${reportId}`);
      throw new NotFoundException('Report not found');
    }
    
    // Check access permissions
    if (report.generatedBy !== userId && !report.sharedWith.includes(userId)) {
      this.logger.warn(`Access denied to report ${reportId} for user ${userId}`);
      throw new ReportAccessDeniedException(reportId);
    }
    
    return report;
  }

  async deleteReport(userId: string, reportId: string): Promise<void> {
    const report = await this.getReport(userId, reportId);
    
    if (report.generatedBy !== userId) {
      this.logger.warn(`Delete denied: User ${userId} cannot delete report ${reportId}`);
      throw new ForbiddenException('Only the report creator can delete this report');
    }
    
    this.logger.log(`Report deleted: ${reportId} by user: ${userId}`);
    
    await this.reportRepository.delete(reportId);
  }

  private async validateVTuberAccess(userId: string, vtuberId: string, userRole: string): Promise<void> {
    // Mock validation - in real implementation would check user permissions
    if (userRole === 'ADMIN') {
      return; // Admins can access any VTuber data
    }
    
    // For VTubers, ensure they can only access their own data
    // This is a simplified check - real implementation would query user-vtuber relationships
    if (vtuberId && vtuberId !== userId) {
      this.logger.warn(`Access denied: User ${userId} attempted to access VTuber data for ${vtuberId}`);
      throw new VTuberDataAccessException(userId, vtuberId);
    }
  }

  private async calculateDashboardMetrics(vtuberId: string, startDate: Date, endDate: Date): Promise<VTuberDashboard> {
    // Mock calculation - real implementation would aggregate from multiple data sources
    const dashboard = this.dashboardRepository.create({
      vtuberId,
      periodStart: startDate,
      periodEnd: endDate,
      totalRevenue: 100000,
      gachaRevenue: 60000,
      medalRevenue: 40000,
      revenueGrowth: 15.5,
      totalFans: 5000,
      activeFans: 3500,
      newFans: 500,
      fanGrowthRate: 10.2,
      gachaPlays: 25000,
      uniqueGachaUsers: 1200,
      averageGachaSpend: 50.0,
      rewardsDistributed: 850,
      digitalRewards: 600,
      physicalRewards: 250,
      conversionRate: 12.5,
      retentionRate: 75.0,
      churnRate: 8.5,
      calculatedAt: new Date(),
      metadata: {}
    });
    
    return await this.dashboardRepository.save(dashboard);
  }

  private async aggregateRevenueData(vtuberId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock revenue aggregation
    return {
      totalRevenue: 100000,
      gachaRevenue: 60000,
      medalRevenue: 40000,
      growthRate: 15.5,
      dailyBreakdown: [
        { date: startDate.toISOString().split('T')[0], revenue: 3333 },
        { date: new Date(startDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], revenue: 3500 }
      ],
      revenueBySource: {
        gacha: 60000,
        medals: 40000
      }
    };
  }

  private async aggregateGachaData(vtuberId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock gacha aggregation
    return {
      totalPlays: 25000,
      uniqueUsers: 1200,
      averageSpend: 50.0,
      conversionRate: 12.5,
      topGachas: [
        {
          gachaId: 'gacha-1',
          name: 'Premium Gacha',
          plays: 15000,
          revenue: 75000,
          users: 800
        }
      ],
      itemDistribution: {
        common: 18000,
        rare: 5000,
        legendary: 2000
      }
    };
  }

  private async aggregateUserData(vtuberId: string, startDate: Date, endDate: Date): Promise<any> {
    // Mock user analytics aggregation
    return {
      totalUsers: 5000,
      activeUsers: 3500,
      newUsers: 500,
      retention: {
        day1: 85,
        day7: 60,
        day30: 35,
        day90: 20
      },
      behavior: {
        averageSessionTime: 45,
        dailyActiveUsers: 1200,
        weeklyActiveUsers: 3500
      },
      conversion: {
        freeToPayingRate: 12.5,
        averageLifetimeValue: 150
      },
      churn: {
        churnRate: 8.5,
        riskFactors: ['Low engagement', 'No recent purchases']
      }
    };
  }
}