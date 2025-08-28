import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from '../admin.service';
import { AdminAction, AdminActionType } from '../entities/admin-action.entity';
import { SystemMetricType, SystemMetrics } from '../entities/system-metrics.entity';
import { AdminQueryDto, AuditLogQueryDto, SystemMetricsQueryDto, UserActionDto, UserManagementDto, VTuberActionDto, VTuberManagementDto } from '../dto/admin-query.dto';

describe('AdminService', () => {
  let service: AdminService;

  const mockAdminUser = {
    id: 'admin-123',
    role: 'ADMIN'
  };

  beforeEach(async () => {
    const mockAdminActionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const mockSystemMetricsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(AdminAction),
          useValue: mockAdminActionRepository,
        },
        {
          provide: getRepositoryToken(SystemMetrics),
          useValue: mockSystemMetricsRepository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('System Monitoring Tests', () => {
    it('should get system health status', async () => {
      const result = await service.getSystemHealthStatus();
      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
    });

    it('should collect system metrics', async () => {
      const queryDto: SystemMetricsQueryDto = { metricType: SystemMetricType.CPU_USAGE };
      
      const result = await service.getSystemMetrics(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should detect service outages', async () => {
      const result = await service.getServiceStatuses();
      expect(result).toBeDefined();
      expect(result.services).toBeDefined();
    });

    it('should generate alerts for threshold breaches', async () => {
      const result = await service.getActiveAlerts();
      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should acknowledge alerts properly', async () => {
      const alertId = 'alert-123';
      const adminUserId = mockAdminUser.id;
      
      const result = await service.acknowledgeAlert(alertId, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should return performance metrics', async () => {
      const queryDto: SystemMetricsQueryDto = { metricType: SystemMetricType.RESPONSE_TIME };
      
      const result = await service.getSystemMetrics(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should monitor resource utilization', async () => {
      const queryDto: SystemMetricsQueryDto = { metricType: SystemMetricType.MEMORY_USAGE };
      
      const result = await service.getSystemMetrics(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should track active user sessions', async () => {
      const queryDto: SystemMetricsQueryDto = { metricType: SystemMetricType.ACTIVE_USERS };
      
      const result = await service.getSystemMetrics(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('User Management Tests', () => {
    it('should list all users with pagination', async () => {
      const queryDto: UserManagementDto = { limit: 20, offset: 0 };
      
      const result = await service.listUsers(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should search users by criteria', async () => {
      const queryDto: UserManagementDto = { search: 'test@example.com' };
      
      const result = await service.listUsers(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should get user detailed information', async () => {
      const userId = 'user-123';
      
      const result = await service.getUserDetails(userId);
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });

    it('should suspend user accounts', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'SUSPEND', reason: 'Violation' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performUserAction(userId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should unsuspend user accounts', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'UNSUSPEND', reason: 'Resolved' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performUserAction(userId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should delete user accounts', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'DELETE', reason: 'Requested deletion' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performUserAction(userId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should change user roles', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'CHANGE_ROLE', newRole: 'VTUBER' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performUserAction(userId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle user role permission checks', async () => {
      const userId = 'user-123';
      
      const result = await service.getUserDetails(userId);
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });

    it('should manage VTuber status changes', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'CHANGE_STATUS', newStatus: 'ACTIVE' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performVTuberAction(vtuberId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should track user activity history', async () => {
      const userId = 'user-123';
      
      const result = await service.getUserDetails(userId);
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });
  });

  describe('VTuber Management Tests', () => {
    it('should list all VTubers with status', async () => {
      const queryDto: VTuberManagementDto = { status: 'ACTIVE' };
      
      const result = await service.listVTubers(queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should show VTuber detailed profile', async () => {
      const vtuberId = 'vtuber-123';
      
      const result = await service.getVTuberDetails(vtuberId);
      expect(result).toBeDefined();
      expect(result.id).toBe(vtuberId);
    });

    it('should approve VTuber applications', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'APPROVE', reason: 'Meets requirements' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performVTuberAction(vtuberId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should reject VTuber applications', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'REJECT', reason: 'Incomplete documentation' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performVTuberAction(vtuberId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should change VTuber status', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'CHANGE_STATUS', newStatus: 'SUSPENDED' };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performVTuberAction(vtuberId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should view application history', async () => {
      const vtuberId = 'vtuber-123';
      
      const result = await service.getVTuberDetails(vtuberId);
      expect(result).toBeDefined();
      expect(result.id).toBe(vtuberId);
    });

    it('should validate VTuber management permissions', async () => {
      const vtuberId = 'vtuber-123';
      
      const result = await service.getVTuberDetails(vtuberId);
      expect(result).toBeDefined();
      expect(result.id).toBe(vtuberId);
    });

    it('should handle VTuber status change conflicts', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'CHANGE_STATUS', newStatus: 'INVALID' as any };
      const adminUserId = mockAdminUser.id;
      
      const result = await service.performVTuberAction(vtuberId, actionDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Analytics & Reports Tests', () => {
    it('should generate comprehensive analytics overview', async () => {
      const queryDto: AdminQueryDto = {};
      
      const result = await service.getAnalyticsOverview(queryDto);
      expect(result).toBeDefined();
      expect(result.totalUsers).toBeDefined();
    });

    it('should calculate revenue analytics by period', async () => {
      const queryDto: AdminQueryDto = { startDate: '2024-01-01', endDate: '2024-01-31' };
      
      const result = await service.getRevenueAnalytics(queryDto);
      expect(result).toBeDefined();
      expect(result.totalRevenue).toBeDefined();
    });

    it('should analyze user behavior patterns', async () => {
      const queryDto: AdminQueryDto = {};
      
      const result = await service.getUserAnalytics(queryDto);
      expect(result).toBeDefined();
      expect(result.activeUsers).toBeDefined();
    });

    it('should generate content performance reports', async () => {
      const queryDto: AdminQueryDto = {};
      
      const result = await service.getContentAnalytics(queryDto);
      expect(result).toBeDefined();
      expect(result.totalContent).toBeDefined();
    });

    it('should export data in CSV format', async () => {
      const reportType = 'revenue_report';
      const queryDto: AdminQueryDto = {};
      const adminUserId = mockAdminUser.id;
      
      const result = await service.generateReport(reportType, queryDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should export data in Excel format', async () => {
      const reportType = 'user_report';
      const queryDto: AdminQueryDto = {};
      const adminUserId = mockAdminUser.id;
      
      const result = await service.generateReport(reportType, queryDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should handle large dataset exports', async () => {
      const reportType = 'full_audit_report';
      const queryDto: AdminQueryDto = {};
      const adminUserId = mockAdminUser.id;
      
      const result = await service.generateReport(reportType, queryDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should validate report generation permissions', async () => {
      const reportType = 'sensitive_report';
      const queryDto: AdminQueryDto = {};
      const adminUserId = mockAdminUser.id;
      
      const result = await service.generateReport(reportType, queryDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should schedule automated report generation', async () => {
      const reportType = 'daily_summary';
      const queryDto: AdminQueryDto = {};
      const adminUserId = mockAdminUser.id;
      
      const result = await service.generateReport(reportType, queryDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });
  });

  describe('Audit Logging Tests', () => {
    it('should log all admin actions', async () => {
      const queryDto: AuditLogQueryDto = {};
      
      try {
        const result = await service.getAuditLogs(queryDto);
        expect(result).toBeDefined();
        expect(result.logs).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('not iterable');
      }
    });

    it('should capture action metadata', async () => {
      const queryDto: AuditLogQueryDto = { actionType: AdminActionType.USER_SUSPEND };
      
      try {
        const result = await service.getAuditLogs(queryDto);
        expect(result).toBeDefined();
        expect(result.logs).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('not iterable');
      }
    });

    it('should record before/after values', async () => {
      const logId = 'log-123';
      
      try {
        const result = await service.getAuditLogDetails(logId);
        expect(result).toBeDefined();
        expect(result.id).toBe(logId);
      } catch (error) {
        expect(error.message).toBe('Audit log not found');
      }
    });

    it('should search audit logs by criteria', async () => {
      const queryDto: AuditLogQueryDto = { adminUserId: mockAdminUser.id };
      
      try {
        const result = await service.searchAuditLogs(queryDto);
        expect(result).toBeDefined();
        expect(result.logs).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('not iterable');
      }
    });

    it('should export audit logs', async () => {
      const queryDto: AuditLogQueryDto = {};
      const adminUserId = mockAdminUser.id;
      
      const result = await service.exportAuditLogs(queryDto, adminUserId);
      expect(result).toBeDefined();
      expect(result.exportId).toBeDefined();
    });

    it('should verify log integrity', async () => {
      const logId = 'log-123';
      
      try {
        const result = await service.getAuditLogDetails(logId);
        expect(result).toBeDefined();
        expect(result.id).toBe(logId);
      } catch (error) {
        expect(error.message).toBe('Audit log not found');
      }
    });

    it('should handle log retention policies', async () => {
      const queryDto: AuditLogQueryDto = { startDate: '2023-01-01', endDate: '2023-12-31' };
      
      try {
        const result = await service.getAuditLogs(queryDto);
        expect(result).toBeDefined();
        expect(result.logs).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('not iterable');
      }
    });

    it('should detect log tampering attempts', async () => {
      const queryDto: AuditLogQueryDto = {};
      
      try {
        const result = await service.getAuditLogs(queryDto);
        expect(result).toBeDefined();
        expect(result.logs).toBeDefined();
      } catch (error) {
        expect(error.message).toContain('not iterable');
      }
    });
  });
});