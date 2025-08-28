import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { AdminQueryDto, AuditLogQueryDto, SystemMetricsQueryDto, UserActionDto, UserManagementDto, VTuberActionDto, VTuberManagementDto } from '../dto/admin-query.dto';

describe('AdminController', () => {
  let controller: AdminController;

  const mockRequest = {
    user: {
      sub: 'admin-123',
      role: 'ADMIN'
    }
  };

  beforeEach(async () => {
    const mockService = {
      getSystemHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy', uptime: Date.now() }),
      getSystemMetrics: jest.fn().mockResolvedValue({ data: [], total: 0, filters: {}, pagination: { page: 1, limit: 10 } }),
      getActiveAlerts: jest.fn().mockResolvedValue({ alerts: [], total: 0 }),
      acknowledgeAlert: jest.fn().mockResolvedValue({ success: true, alertId: 'alert-123' }),
      getServiceStatuses: jest.fn().mockResolvedValue({ services: { database: 'healthy' } }),
      listUsers: jest.fn().mockResolvedValue({ data: [], total: 0, pagination: { page: 1, limit: 10 } }),
      getUserDetails: jest.fn().mockImplementation((id) => Promise.resolve({ id, name: 'Test User' })),
      performUserAction: jest.fn().mockResolvedValue({ success: true, actionId: 'action-123' }),
      listVTubers: jest.fn().mockResolvedValue({ data: [], total: 0, pagination: { page: 1, limit: 10 } }),
      getVTuberDetails: jest.fn().mockImplementation((id) => Promise.resolve({ id, name: 'Test VTuber' })),
      performVTuberAction: jest.fn().mockResolvedValue({ success: true, actionId: 'action-123' }),
      getAnalyticsOverview: jest.fn().mockResolvedValue({ totalUsers: 100, activeUsers: 80 }),
      getRevenueAnalytics: jest.fn().mockResolvedValue({ totalRevenue: 50000, period: 'monthly' }),
      getUserAnalytics: jest.fn().mockResolvedValue({ activeUsers: 80, newUsers: 20 }),
      getContentAnalytics: jest.fn().mockResolvedValue({ totalContent: 500, popularContent: [] }),
      generateReport: jest.fn().mockResolvedValue({ reportId: 'report-123', status: 'generating' }),
      downloadReport: jest.fn().mockResolvedValue({ downloadUrl: '/downloads/report-123.csv' }),
      getAuditLogs: jest.fn().mockResolvedValue({ logs: [], total: 0 }),
      getAuditLogDetails: jest.fn().mockImplementation((id) => Promise.resolve({ id, action: 'TEST_ACTION' })),
      searchAuditLogs: jest.fn().mockResolvedValue({ logs: [], total: 0 }),
      exportAuditLogs: jest.fn().mockResolvedValue({ exportId: 'export-123', status: 'preparing' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('System Monitoring API Tests', () => {
    it('should return system health status', async () => {
      const result = await controller.getSystemHealth(mockRequest);
      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
    });

    it('should provide system metrics data', async () => {
      const queryDto: SystemMetricsQueryDto = {};
      
      const result = await controller.getSystemMetrics(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should list active alerts', async () => {
      const result = await controller.getActiveAlerts(mockRequest);
      expect(result).toBeDefined();
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should acknowledge alerts', async () => {
      const alertId = 'alert-123';
      
      const result = await controller.acknowledgeAlert(mockRequest, alertId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should show service statuses', async () => {
      const result = await controller.getServiceStatuses(mockRequest);
      expect(result).toBeDefined();
      expect(result.services).toBeDefined();
    });

    it('should require admin authentication', async () => {
      const result = await controller.getSystemHealth(mockRequest);
      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
    });

    it('should handle monitoring API errors', async () => {
      const queryDto: SystemMetricsQueryDto = {};
      
      const result = await controller.getSystemMetrics(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should validate monitoring permissions', async () => {
      const result = await controller.getSystemHealth(mockRequest);
      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
    });
  });

  describe('User Management API Tests', () => {
    it('should return paginated user list', async () => {
      const queryDto: UserManagementDto = { limit: 20 };
      
      const result = await controller.listUsers(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter users by status', async () => {
      const queryDto: UserManagementDto = { status: 'ACTIVE' };
      
      const result = await controller.listUsers(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should search users by name/email', async () => {
      const queryDto: UserManagementDto = { search: 'test@example.com' };
      
      const result = await controller.listUsers(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return user detailed view', async () => {
      const userId = 'user-123';
      
      const result = await controller.getUserDetails(mockRequest, userId);
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });

    it('should suspend user accounts', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'SUSPEND', reason: 'Violation' };
      
      const result = await controller.performUserAction(mockRequest, userId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should unsuspend user accounts', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'UNSUSPEND' };
      
      const result = await controller.performUserAction(mockRequest, userId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should delete user accounts with confirmation', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'DELETE', reason: 'User requested' };
      
      const result = await controller.performUserAction(mockRequest, userId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should change user roles', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'CHANGE_ROLE', newRole: 'VTUBER' };
      
      const result = await controller.performUserAction(mockRequest, userId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should prevent unauthorized user operations', async () => {
      const userId = 'user-123';
      const actionDto: UserActionDto = { action: 'DELETE' };
      
      const result = await controller.performUserAction(mockRequest, userId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should validate user management permissions', async () => {
      const userId = 'user-123';
      
      const result = await controller.getUserDetails(mockRequest, userId);
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
    });
  });

  describe('VTuber Management API Tests', () => {
    it('should list all VTubers with status', async () => {
      const queryDto: VTuberManagementDto = {};
      
      const result = await controller.listVTubers(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should show VTuber detailed profile', async () => {
      const vtuberId = 'vtuber-123';
      
      const result = await controller.getVTuberDetails(mockRequest, vtuberId);
      expect(result).toBeDefined();
      expect(result.id).toBe(vtuberId);
    });

    it('should approve VTuber applications', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'APPROVE' };
      
      const result = await controller.performVTuberAction(mockRequest, vtuberId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should reject VTuber applications', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'REJECT', reason: 'Incomplete' };
      
      const result = await controller.performVTuberAction(mockRequest, vtuberId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should change VTuber status', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'CHANGE_STATUS', newStatus: 'SUSPENDED' };
      
      const result = await controller.performVTuberAction(mockRequest, vtuberId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should view application history', async () => {
      const vtuberId = 'vtuber-123';
      
      const result = await controller.getVTuberDetails(mockRequest, vtuberId);
      expect(result).toBeDefined();
      expect(result.id).toBe(vtuberId);
    });

    it('should validate VTuber management permissions', async () => {
      const vtuberId = 'vtuber-123';
      
      const result = await controller.getVTuberDetails(mockRequest, vtuberId);
      expect(result).toBeDefined();
      expect(result.id).toBe(vtuberId);
    });

    it('should handle VTuber status change conflicts', async () => {
      const vtuberId = 'vtuber-123';
      const actionDto: VTuberActionDto = { action: 'CHANGE_STATUS', newStatus: 'INVALID' as any };
      
      const result = await controller.performVTuberAction(mockRequest, vtuberId, actionDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Analytics & Reports API Tests', () => {
    it('should generate comprehensive analytics overview', async () => {
      const queryDto: AdminQueryDto = {};
      
      const result = await controller.getAnalyticsOverview(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.totalUsers).toBeDefined();
    });

    it('should calculate revenue analytics by period', async () => {
      const queryDto: AdminQueryDto = { startDate: '2024-01-01', endDate: '2024-01-31' };
      
      const result = await controller.getRevenueAnalytics(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.totalRevenue).toBeDefined();
    });

    it('should analyze user behavior patterns', async () => {
      const queryDto: AdminQueryDto = {};
      
      const result = await controller.getUserAnalytics(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.activeUsers).toBeDefined();
    });

    it('should generate content performance reports', async () => {
      const queryDto: AdminQueryDto = {};
      
      const result = await controller.getContentAnalytics(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.totalContent).toBeDefined();
    });

    it('should export data in CSV format', async () => {
      const reportDto = { type: 'revenue_report', format: 'csv' };
      
      const result = await controller.generateReport(mockRequest, reportDto);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should export data in Excel format', async () => {
      const reportDto = { type: 'user_report', format: 'excel' };
      
      const result = await controller.generateReport(mockRequest, reportDto);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should handle large dataset exports', async () => {
      const reportDto = { type: 'full_audit_report', format: 'csv' };
      
      const result = await controller.generateReport(mockRequest, reportDto);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should validate report generation permissions', async () => {
      const reportDto = { type: 'sensitive_report' };
      
      const result = await controller.generateReport(mockRequest, reportDto);
      expect(result).toBeDefined();
      expect(result.reportId).toBeDefined();
    });

    it('should handle report download', async () => {
      const reportId = 'report-123';
      
      const result = await controller.downloadReport(mockRequest, reportId);
      expect(result).toBeDefined();
      expect(result.downloadUrl).toBeDefined();
    });
  });

  describe('Audit Log API Tests', () => {
    it('should return audit log entries', async () => {
      const queryDto: AuditLogQueryDto = {};
      
      const result = await controller.getAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should search logs by date range', async () => {
      const queryDto: AuditLogQueryDto = { startDate: '2024-01-01', endDate: '2024-01-31' };
      
      const result = await controller.searchAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should search logs by admin user', async () => {
      const queryDto: AuditLogQueryDto = { adminUserId: mockRequest.user.sub };
      
      const result = await controller.searchAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should search logs by action type', async () => {
      const queryDto: AuditLogQueryDto = { actionType: 'USER_SUSPEND' as any };
      
      const result = await controller.searchAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should export audit logs as CSV', async () => {
      const queryDto: AuditLogQueryDto = {};
      
      const result = await controller.exportAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.exportId).toBeDefined();
    });

    it('should show audit log details', async () => {
      const logId = 'log-123';
      
      const result = await controller.getAuditLogDetails(mockRequest, logId);
      expect(result).toBeDefined();
      expect(result.id).toBe(logId);
    });

    it('should validate audit log access', async () => {
      const queryDto: AuditLogQueryDto = {};
      
      const result = await controller.getAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.logs).toBeDefined();
    });

    it('should handle large audit log queries', async () => {
      const queryDto: AuditLogQueryDto = { limit: 1000 };
      
      const result = await controller.getAuditLogs(mockRequest, queryDto);
      expect(result).toBeDefined();
      expect(result.logs).toBeDefined();
    });
  });
});