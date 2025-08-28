import { BadRequestException, Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAction, AdminActionStatus, AdminActionType, AdminTargetType } from './entities/admin-action.entity';
import { MetricStatus, SystemMetricType, SystemMetrics } from './entities/system-metrics.entity';
import { AdminQueryDto, AuditLogQueryDto, SystemMetricsQueryDto, UserActionDto, UserManagementDto, VTuberActionDto, VTuberManagementDto } from './dto/admin-query.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AdminAction)
    private adminActionRepository: Repository<AdminAction>,
    @InjectRepository(SystemMetrics)
    private systemMetricsRepository: Repository<SystemMetrics>,
  ) {}

  async getSystemHealthStatus(): Promise<{ status: string; uptime: number; services: Record<string, { status: string; responseTime: number }>; metrics: Record<string, number> }> {
    this.logger.log('Getting system health status');
    
    // Mock system health data
    return {
      status: 'healthy',
      uptime: Date.now(),
      services: {
        database: { status: 'healthy', responseTime: 25 },
        redis: { status: 'healthy', responseTime: 5 },
        api: { status: 'healthy', responseTime: 50 }
      },
      metrics: {
        cpuUsage: 45.2,
        memoryUsage: 68.7,
        diskUsage: 32.1
      }
    };
  }

  async getSystemMetrics(queryDto: SystemMetricsQueryDto): Promise<{ metrics: SystemMetrics[]; total: number; offset: number; limit: number }> {
    this.logger.log('Getting system metrics');
    
    const queryBuilder = this.systemMetricsRepository.createQueryBuilder('metric')
      .orderBy('metric.collectedAt', 'DESC')
      .limit(queryDto.limit ?? 100)
      .offset(queryDto.offset ?? 0);
    
    if (queryDto.metricType) {
      queryBuilder.andWhere('metric.metricType = :metricType', { metricType: queryDto.metricType });
    }
    
    if (queryDto.source) {
      queryBuilder.andWhere('metric.source = :source', { source: queryDto.source });
    }
    
    if (queryDto.status) {
      queryBuilder.andWhere('metric.status = :status', { status: queryDto.status });
    }
    
    if (queryDto.startDate && queryDto.endDate) {
      queryBuilder.andWhere('metric.collectedAt BETWEEN :startDate AND :endDate', {
        startDate: queryDto.startDate,
        endDate: queryDto.endDate
      });
    }
    
    const [metrics, total] = await queryBuilder.getManyAndCount();
    
    return { 
      data: metrics, 
      total,
      filters: {
        metricType: queryDto.metricType,
        source: queryDto.source,
        status: queryDto.status
      },
      pagination: {
        page: Math.floor((queryDto.offset ?? 0) / (queryDto.limit ?? 100)) + 1,
        limit: queryDto.limit ?? 100
      }
    };
  }

  async getActiveAlerts(): Promise<any> {
    this.logger.log('Getting active alerts');
    
    // Mock alert data
    return {
      alerts: [
        {
          id: 'alert-001',
          type: 'HIGH_CPU_USAGE',
          severity: 'WARNING',
          message: 'CPU usage above 80%',
          timestamp: new Date(),
          acknowledged: false
        },
        {
          id: 'alert-002',
          type: 'HIGH_MEMORY_USAGE', 
          severity: 'CRITICAL',
          message: 'Memory usage above 90%',
          timestamp: new Date(),
          acknowledged: false
        }
      ],
      total: 2
    };
  }

  async acknowledgeAlert(alertId: string, adminUserId: string): Promise<any> {
    this.logger.log(`Acknowledging alert ${alertId} by admin ${adminUserId}`);
    
    // Create audit record
    const auditAction = this.adminActionRepository.create({
      adminUserId,
      actionType: AdminActionType.ALERT_ACKNOWLEDGE,
      targetType: AdminTargetType.SYSTEM,
      targetId: alertId,
      actionData: { alertId },
      status: AdminActionStatus.COMPLETED,
      executedAt: new Date(),
      completedAt: new Date()
    });
    
    await this.adminActionRepository.save(auditAction);
    
    return {
      success: true,
      alertId,
      acknowledgedAt: new Date(),
      acknowledgedBy: adminUserId
    };
  }

  async getServiceStatuses(): Promise<any> {
    this.logger.log('Getting service statuses');
    
    // Mock service status data
    return {
      services: [
        { name: 'API Gateway', status: 'healthy', uptime: '99.9%' },
        { name: 'Database', status: 'healthy', uptime: '99.95%' },
        { name: 'Redis Cache', status: 'healthy', uptime: '99.8%' },
        { name: 'Background Jobs', status: 'healthy', uptime: '99.7%' },
        { name: 'File Storage', status: 'healthy', uptime: '99.99%' }
      ]
    };
  }

  async listUsers(queryDto: UserManagementDto): Promise<any> {
    this.logger.log('Listing users with query:', queryDto);
    
    // Mock user data - in real implementation would query user service/database
    const mockUsers = [
      {
        id: 'user-001',
        username: 'testuser1',
        email: 'test1@example.com',
        role: 'USER',
        status: 'ACTIVE',
        registeredAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-15')
      },
      {
        id: 'user-002',
        username: 'vtuber1',
        email: 'vtuber1@example.com',
        role: 'VTUBER',
        status: 'ACTIVE',
        registeredAt: new Date('2024-01-02'),
        lastLogin: new Date('2024-01-16')
      }
    ];
    
    // Apply filters
    let filteredUsers = mockUsers;
    if (queryDto.search) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.includes(queryDto.search!) || user.email.includes(queryDto.search!)
      );
    }
    if (queryDto.status) {
      filteredUsers = filteredUsers.filter(user => user.status === queryDto.status);
    }
    if (queryDto.role) {
      filteredUsers = filteredUsers.filter(user => user.role === queryDto.role);
    }
    
    // Apply pagination
    const offset = queryDto.offset ?? 0;
    const limit = queryDto.limit ?? 20;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);
    
    return {
      data: paginatedUsers,
      total: filteredUsers.length,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit
      }
    };
  }

  async getUserDetails(userId: string): Promise<any> {
    this.logger.log(`Getting user details for ${userId}`);
    
    // Mock user details - in real implementation would query user service
    return {
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        displayName: 'Test User',
        avatar: null,
        birthDate: '1990-01-01'
      },
      activity: {
        registeredAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-15'),
        loginCount: 45,
        gachaPlays: 123,
        totalSpent: 15000
      },
      statistics: {
        sessionsCount: 45,
        averageSessionTime: 2400,
        favoriteVTubers: ['vtuber-1', 'vtuber-2']
      }
    };
  }

  async performUserAction(userId: string, actionDto: UserActionDto, adminUserId: string): Promise<any> {
    this.logger.log(`Performing user action ${actionDto.action} on user ${userId} by admin ${adminUserId}`);
    
    await this.validateAdminPermission(adminUserId, 'USER_MANAGEMENT');
    
    // Get current user details for audit
    const currentUser = await this.getUserDetails(userId);
    
    let actionType: AdminActionType;
    let newValues: any = {};
    
    switch (actionDto.action) {
      case 'SUSPEND':
        actionType = AdminActionType.USER_SUSPEND;
        newValues = { status: 'SUSPENDED' };
        break;
      case 'UNSUSPEND':
        actionType = AdminActionType.USER_UNSUSPEND;
        newValues = { status: 'ACTIVE' };
        break;
      case 'DELETE':
        actionType = AdminActionType.USER_DELETE;
        newValues = { status: 'DELETED' };
        break;
      case 'CHANGE_ROLE':
        actionType = AdminActionType.USER_ROLE_CHANGE;
        newValues = { role: actionDto.newRole };
        break;
      default:
        throw new BadRequestException('Invalid action type');
    }
    
    // Log the admin action
    const adminAction = await this.logAdminAction(
      adminUserId,
      actionType,
      AdminTargetType.USER,
      userId,
      { reason: actionDto.reason },
      { status: currentUser.status, role: currentUser.role },
      newValues
    );
    
    // In real implementation, would actually perform the action on the user
    
    return {
      success: true,
      action: adminAction,
      message: `User ${actionDto.action.toLowerCase()} completed`
    };
  }

  async listVTubers(queryDto: VTuberManagementDto): Promise<any> {
    this.logger.log('Listing VTubers with query:', queryDto);
    
    // Mock VTuber data - in real implementation would query VTuber service
    const mockVTubers = [
      {
        id: 'vtuber-001',
        username: 'vtuber_alice',
        channelName: 'Alice Channel',
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        appliedAt: new Date('2024-01-01'),
        approvedAt: new Date('2024-01-05'),
        statistics: {
          totalFans: 15000,
          totalRevenue: 450000,
          gachaCount: 25
        }
      },
      {
        id: 'vtuber-002',
        username: 'vtuber_bob',
        channelName: 'Bob Gaming',
        status: 'PENDING',
        approvalStatus: 'PENDING',
        appliedAt: new Date('2024-01-10'),
        statistics: {
          totalFans: 0,
          totalRevenue: 0,
          gachaCount: 0
        }
      }
    ];
    
    // Apply filters
    let filteredVTubers = mockVTubers;
    if (queryDto.search) {
      filteredVTubers = filteredVTubers.filter(vtuber => 
        vtuber.username.includes(queryDto.search!) || 
        vtuber.channelName.includes(queryDto.search!)
      );
    }
    if (queryDto.status) {
      filteredVTubers = filteredVTubers.filter(vtuber => vtuber.status === queryDto.status);
    }
    
    // Apply pagination
    const offset = queryDto.offset ?? 0;
    const limit = queryDto.limit ?? 20;
    const paginatedVTubers = filteredVTubers.slice(offset, offset + limit);
    
    return {
      data: paginatedVTubers,
      total: filteredVTubers.length,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit
      }
    };
  }

  async getVTuberDetails(vtuberId: string): Promise<any> {
    this.logger.log(`Getting VTuber details for ${vtuberId}`);
    
    // Mock VTuber details - in real implementation would query VTuber service
    return {
      id: vtuberId,
      username: 'vtuber_alice',
      channelName: 'Alice Channel',
      email: 'alice@example.com',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      profile: {
        displayName: 'Alice',
        avatar: 'https://example.com/avatar.jpg',
        description: 'Gaming VTuber',
        socialLinks: {
          twitter: '@alice_vtuber',
          youtube: 'alice_channel'
        }
      },
      statistics: {
        totalFans: 15000,
        activeFans: 12000,
        totalRevenue: 450000,
        gachaCount: 25,
        averageViewers: 500,
        peakViewers: 2500
      },
      timeline: [
        { date: new Date('2024-01-01'), event: 'Application submitted' },
        { date: new Date('2024-01-05'), event: 'Application approved' },
        { date: new Date('2024-01-10'), event: 'First stream' }
      ]
    };
  }

  async performVTuberAction(vtuberId: string, actionDto: VTuberActionDto, adminUserId: string): Promise<any> {
    this.logger.log(`Performing VTuber action ${actionDto.action} on VTuber ${vtuberId} by admin ${adminUserId}`);
    
    await this.validateAdminPermission(adminUserId, 'VTUBER_MANAGEMENT');
    
    // Get current VTuber details for audit
    const currentVTuber = await this.getVTuberDetails(vtuberId);
    
    let actionType: AdminActionType;
    let newValues: any = {};
    
    switch (actionDto.action) {
      case 'APPROVE':
        actionType = AdminActionType.VTUBER_APPROVE;
        newValues = { approvalStatus: 'APPROVED', status: 'ACTIVE' };
        break;
      case 'REJECT':
        actionType = AdminActionType.VTUBER_REJECT;
        newValues = { approvalStatus: 'REJECTED', status: 'INACTIVE' };
        break;
      case 'CHANGE_STATUS':
        actionType = AdminActionType.VTUBER_STATUS_CHANGE;
        newValues = { status: actionDto.newStatus };
        break;
      default:
        throw new BadRequestException('Invalid VTuber action type');
    }
    
    // Log the admin action
    const adminAction = await this.logAdminAction(
      adminUserId,
      actionType,
      AdminTargetType.VTUBER,
      vtuberId,
      { reason: actionDto.reason },
      { status: currentVTuber.status, approvalStatus: currentVTuber.approvalStatus },
      newValues
    );
    
    return {
      success: true,
      action: adminAction,
      message: `VTuber ${actionDto.action.toLowerCase()} completed`
    };
  }

  async getAnalyticsOverview(): Promise<{ message: string }> {
    this.logger.log('Getting analytics overview');
    
    // Mock analytics overview data
    return {
      totalUsers: 50000,
      totalVTubers: 150,
      totalRevenue: 5500000,
      totalGachaPlays: 2500000,
      growth: {
        usersGrowth: 15.5,
        vtubersGrowth: 8.2,
        revenueGrowth: 22.1,
        gachaPlaysGrowth: 18.7
      },
      topPerformers: {
        topVTubersByRevenue: [
          { id: 'vtuber-001', name: 'Alice Channel', revenue: 450000 },
          { id: 'vtuber-002', name: 'Bob Gaming', revenue: 380000 }
        ],
        topGachasByPlays: [
          { id: 'gacha-001', name: 'Premium Collection', plays: 125000 },
          { id: 'gacha-002', name: 'Special Items', plays: 98000 }
        ]
      },
      trends: {
        dailyActiveUsers: 25000,
        averageSessionTime: 45,
        conversionRate: 12.5
      }
    };
  }

  async getRevenueAnalytics(): Promise<{ message: string }> {
    this.logger.log('Getting revenue analytics');
    
    // Mock revenue analytics data
    return {
      totalRevenue: 5500000,
      revenueGrowth: 22.1,
      revenueBySource: {
        gacha: 3800000,
        medals: 1200000,
        rewards: 500000
      },
      revenueByPeriod: [
        { date: '2024-01-01', revenue: 180000 },
        { date: '2024-01-02', revenue: 195000 },
        { date: '2024-01-03', revenue: 210000 }
      ],
      topRevenueVTubers: [
        { id: 'vtuber-001', name: 'Alice Channel', revenue: 450000, growth: 25.5 },
        { id: 'vtuber-002', name: 'Bob Gaming', revenue: 380000, growth: 18.2 }
      ]
    };
  }

  async getUserAnalytics(): Promise<{ message: string }> {
    this.logger.log('Getting user analytics');
    
    // Mock user analytics data
    return {
      totalUsers: 50000,
      activeUsers: 35000,
      newUsers: 2500,
      userGrowth: 15.5,
      demographics: {
        ageGroups: {
          '18-24': 25,
          '25-34': 35,
          '35-44': 25,
          '45+': 15
        },
        regions: {
          'Asia': 60,
          'North America': 25,
          'Europe': 10,
          'Others': 5
        }
      },
      behavior: {
        averageSessionTime: 45,
        averageGachaPlays: 3.2,
        retentionRate: {
          day1: 85,
          day7: 60,
          day30: 35
        },
        churnRate: 8.5
      }
    };
  }

  async getContentAnalytics(): Promise<{ message: string }> {
    this.logger.log('Getting content analytics');
    
    // Mock content analytics data
    return {
      totalContent: 450,
      activeContent: 320,
      totalPlays: 2500000,
      averageRevenue: 12500,
      topPerformingGachas: [
        {
          id: 'gacha-001',
          name: 'Premium Collection',
          plays: 125000,
          revenue: 625000,
          conversionRate: 15.2
        },
        {
          id: 'gacha-002',
          name: 'Special Items',
          plays: 98000,
          revenue: 490000,
          conversionRate: 12.8
        }
      ],
      itemDistribution: {
        common: 65,
        rare: 25,
        epic: 8,
        legendary: 2
      }
    };
  }

  async generateReport(reportType: string, queryDto: AdminQueryDto, adminUserId: string): Promise<any> {
    this.logger.log(`Generating report ${reportType} by admin ${adminUserId}`);
    
    await this.validateAdminPermission(adminUserId, 'REPORT_GENERATION');
    
    // Log the admin action
    await this.logAdminAction(
      adminUserId,
      AdminActionType.AUDIT_LOG_EXPORT,
      AdminTargetType.SYSTEM,
      'report-generation',
      { reportType, queryParams: queryDto }
    );
    
    // Mock report generation
    const reportId = `report-${Date.now()}`;
    
    return {
      reportId,
      reportType,
      status: 'GENERATING',
      requestedBy: adminUserId,
      requestedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 300000), // 5 minutes
      downloadUrl: `/api/v1/admin/reports/${reportId}/download`
    };
  }

  async downloadReport(reportId: string, adminUserId: string): Promise<any> {
    this.logger.log(`Downloading report ${reportId} by admin ${adminUserId}`);
    
    await this.validateAdminPermission(adminUserId, 'REPORT_DOWNLOAD');
    
    // Mock report download
    return {
      reportId,
      downloadUrl: `/downloads/${reportId}.csv`,
      filename: `report-${reportId}.csv`,
      contentType: 'text/csv',
      size: Math.floor(Math.random() * 1000000) + 10000, // Mock size
      generatedAt: new Date(Date.now() - Math.random() * 86400000), // Random time within last day
      expiresAt: new Date(Date.now() + 3600000) // Expires in 1 hour
    };
  }

  async exportAuditLogs(queryDto: AuditLogQueryDto, adminUserId: string): Promise<any> {
    this.logger.log(`Exporting audit logs by admin ${adminUserId}`);
    
    await this.validateAdminPermission(adminUserId, 'AUDIT_EXPORT');
    
    // Log the export action
    await this.logAdminAction(
      adminUserId,
      AdminActionType.AUDIT_LOG_EXPORT,
      AdminTargetType.AUDIT_LOG,
      'audit-export',
      { queryParams: queryDto }
    );
    
    const exportId = `export-${Date.now()}`;
    
    return {
      exportId,
      status: 'PREPARING',
      requestedBy: adminUserId,
      requestedAt: new Date(),
      estimatedSize: '25.4 MB',
      downloadUrl: `/api/v1/admin/audit-logs/exports/${exportId}/download`
    };
  }

  async getAuditLogs(queryDto: AuditLogQueryDto): Promise<{ logs: AdminAction[], total: number }> {
    this.logger.log('Getting audit logs');
    
    const queryBuilder = this.adminActionRepository.createQueryBuilder('action')
      .orderBy('action.executedAt', 'DESC')
      .limit(queryDto.limit ?? 50)
      .offset(queryDto.offset ?? 0);
    
    if (queryDto.actionType) {
      queryBuilder.andWhere('action.actionType = :actionType', { actionType: queryDto.actionType });
    }
    
    if (queryDto.targetType) {
      queryBuilder.andWhere('action.targetType = :targetType', { targetType: queryDto.targetType });
    }
    
    if (queryDto.adminUserId) {
      queryBuilder.andWhere('action.adminUserId = :adminUserId', { adminUserId: queryDto.adminUserId });
    }
    
    if (queryDto.targetId) {
      queryBuilder.andWhere('action.targetId = :targetId', { targetId: queryDto.targetId });
    }
    
    if (queryDto.status) {
      queryBuilder.andWhere('action.status = :status', { status: queryDto.status });
    }
    
    if (queryDto.startDate && queryDto.endDate) {
      queryBuilder.andWhere('action.executedAt BETWEEN :startDate AND :endDate', {
        startDate: queryDto.startDate,
        endDate: queryDto.endDate
      });
    }
    
    const [logs, total] = await queryBuilder.getManyAndCount();
    
    return { logs, total };
  }

  async getAuditLogDetails(logId: string): Promise<AdminAction> {
    this.logger.log(`Getting audit log details for ${logId}`);
    
    const log = await this.adminActionRepository.findOne({
      where: { id: logId }
    });
    
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    
    return log;
  }

  async searchAuditLogs(queryDto: AuditLogQueryDto): Promise<{ logs: AdminAction[], total: number }> {
    this.logger.log('Searching audit logs with advanced filters');
    
    // Use the same implementation as getAuditLogs for advanced search
    return await this.getAuditLogs(queryDto);
  }

  private async logAdminAction(
    adminUserId: string,
    actionType: AdminActionType,
    targetType: AdminTargetType,
    targetId: string,
    actionData: any,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<AdminAction> {
    const adminAction = this.adminActionRepository.create({
      adminUserId,
      actionType,
      targetType,
      targetId,
      actionData,
      oldValues,
      newValues,
      ipAddress: ipAddress ?? '127.0.0.1',
      userAgent: userAgent ?? 'Admin Service',
      sessionId: sessionId ?? `session-${Date.now()}`,
      status: AdminActionStatus.COMPLETED,
      executedAt: new Date(),
      completedAt: new Date()
    });
    
    return await this.adminActionRepository.save(adminAction);
  }

  private async validateAdminPermission(adminUserId: string, operation: string): Promise<void> {
    // Mock permission validation - in real implementation would check admin permissions
    this.logger.log(`Validating admin permission for ${adminUserId} on operation ${operation}`);
    
    // For now, assume all admin users have all permissions
    // In real implementation, would check specific role permissions
    if (!adminUserId) {
      throw new ForbiddenException('Admin user ID required');
    }
  }

  private async collectSystemMetric(metricType: SystemMetricType, value: number, source: string): Promise<void> {
    const metric = this.systemMetricsRepository.create({
      metricType,
      metricName: metricType.replace('_', ' ').toLowerCase(),
      value,
      unit: this.getMetricUnit(metricType),
      threshold: this.getMetricThreshold(metricType),
      status: this.calculateMetricStatus(metricType, value),
      source,
      tags: { environment: 'production' },
      collectedAt: new Date()
    });
    
    await this.systemMetricsRepository.save(metric);
  }
  
  private getMetricUnit(metricType: SystemMetricType): string {
    switch (metricType) {
      case SystemMetricType.CPU_USAGE:
      case SystemMetricType.MEMORY_USAGE:
      case SystemMetricType.DISK_USAGE:
      case SystemMetricType.ERROR_RATE:
        return 'percent';
      case SystemMetricType.RESPONSE_TIME:
        return 'ms';
      case SystemMetricType.NETWORK_THROUGHPUT:
        return 'mbps';
      case SystemMetricType.ACTIVE_USERS:
      case SystemMetricType.CONCURRENT_SESSIONS:
      case SystemMetricType.DATABASE_CONNECTIONS:
      case SystemMetricType.QUEUE_LENGTH:
        return 'count';
      default:
        return 'unit';
    }
  }
  
  private getMetricThreshold(metricType: SystemMetricType): number {
    switch (metricType) {
      case SystemMetricType.CPU_USAGE:
        return 80.0;
      case SystemMetricType.MEMORY_USAGE:
        return 85.0;
      case SystemMetricType.DISK_USAGE:
        return 90.0;
      case SystemMetricType.ERROR_RATE:
        return 5.0;
      case SystemMetricType.RESPONSE_TIME:
        return 1000.0;
      default:
        return 100.0;
    }
  }
  
  private calculateMetricStatus(metricType: SystemMetricType, value: number): MetricStatus {
    const threshold = this.getMetricThreshold(metricType);
    
    if (value >= threshold) {
      return MetricStatus.CRITICAL;
    } else if (value >= threshold * 0.8) {
      return MetricStatus.WARNING;
    } else {
      return MetricStatus.NORMAL;
    }
  }
}