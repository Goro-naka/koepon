import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VTuberDashboardService } from '../vtuber-dashboard.service';
import { VTuberDashboard } from '../entities/vtuber-dashboard.entity';
import { AnalyticsReport, PeriodType, ReportStatus, ReportType } from '../entities/analytics-report.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('VTuberDashboardService Integration Tests', () => {
  let service: VTuberDashboardService;
  let dashboardRepository: jest.Mocked<Repository<VTuberDashboard>>;
  let reportRepository: jest.Mocked<Repository<AnalyticsReport>>;

  const mockUser = {
    id: 'user-123',
    role: 'VTUBER'
  };

  const mockVTuberId = 'vtuber-123';

  beforeEach(async () => {
    const mockDashboardRepository = {
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
        getMany: jest.fn(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const mockReportRepository = {
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
        getMany: jest.fn(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VTuberDashboardService,
        {
          provide: getRepositoryToken(VTuberDashboard),
          useValue: mockDashboardRepository,
        },
        {
          provide: getRepositoryToken(AnalyticsReport),
          useValue: mockReportRepository,
        },
      ],
    }).compile();

    service = module.get<VTuberDashboardService>(VTuberDashboardService);
    dashboardRepository = module.get(getRepositoryToken(VTuberDashboard));
    reportRepository = module.get(getRepositoryToken(AnalyticsReport));
  });

  describe('Dashboard Overview', () => {
    it('should return dashboard metrics successfully', async () => {
      const queryDto = {};
      
      const result = await service.getDashboardOverview(mockUser.id, queryDto);
      
      expect(result).toBeDefined();
      expect(result.totalRevenue).toEqual(150000);
      expect(result.revenueGrowth).toEqual(15.5);
      expect(result.totalUsers).toEqual(8500);
      expect(result.activeUsers).toEqual(6200);
    });

    it('should handle VTuber access validation', async () => {
      const queryDto = {};
      
      dashboardRepository.findOne.mockResolvedValue(null);
      dashboardRepository.create.mockReturnValue({
        vtuberId: mockUser.id,
        totalRevenue: 100000,
      } as VTuberDashboard);
      dashboardRepository.save.mockResolvedValue({
        id: 'dashboard-1',
        vtuberId: mockUser.id,
        totalRevenue: 100000,
      } as VTuberDashboard);

      // Using same user ID as VTuber ID to pass access validation
      const result = await service.getDashboardMetrics(mockUser.id, mockUser.id, queryDto);
      
      expect(result).toBeDefined();
      expect(dashboardRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('Report Generation', () => {
    it('should generate report successfully', async () => {
      const reportDto = {
        reportType: 'MONTHLY',
        periodType: 'MONTH',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockReport = {
        id: 'report-123',
        reportType: ReportType.MONTHLY,
        status: ReportStatus.COMPLETED
      };

      reportRepository.create.mockReturnValue(mockReport as AnalyticsReport);
      reportRepository.save.mockResolvedValue(mockReport as AnalyticsReport);

      const result = await service.generateReport(mockUser.id, reportDto);
      
      expect(result).toBeDefined();
      expect(result.reportType).toEqual(ReportType.MONTHLY);
      expect(reportRepository.save).toHaveBeenCalled();
    });

    it('should validate date range in report generation', async () => {
      const invalidReportDto = {
        reportType: 'MONTHLY',
        periodType: 'MONTH',
        startDate: '2024-01-31',
        endDate: '2024-01-01' // End date before start date
      };

      await expect(service.generateReport(mockUser.id, invalidReportDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('Report Management', () => {
    it('should get reports for user', async () => {
      const queryDto = { limit: 10, offset: 0 };
      
      const result = await service.getReports(mockUser.id, queryDto);
      
      expect(result).toBeDefined();
      expect(result.reports).toBeDefined();
      expect(result.total).toBeDefined();
    });

    it('should throw NotFoundException for non-existent report', async () => {
      reportRepository.findOne.mockResolvedValue(null);
      
      await expect(service.getReport(mockUser.id, 'non-existent-id'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should enforce access control on reports', async () => {
      const mockReport = {
        id: 'report-123',
        generatedBy: 'other-user',
        sharedWith: []
      };

      reportRepository.findOne.mockResolvedValue(mockReport as AnalyticsReport);
      
      await expect(service.getReport(mockUser.id, 'report-123'))
        .rejects
        .toThrow(ForbiddenException);
    });
  });

  describe('Analytics Data', () => {
    it('should return revenue analytics', async () => {
      const queryDto = { vtuberId: mockUser.id }; // Use same user ID to pass validation
      
      const result = await service.getRevenueAnalytics(mockUser.id, queryDto);
      
      expect(result).toBeDefined();
      expect(result.totalRevenue).toBeDefined();
      expect(result.gachaRevenue).toBeDefined();
      expect(result.medalRevenue).toBeDefined();
    });

    it('should return gacha analytics', async () => {
      const queryDto = { vtuberId: mockUser.id }; // Use same user ID to pass validation
      
      const result = await service.getGachaAnalytics(mockUser.id, queryDto);
      
      expect(result).toBeDefined();
      expect(result.totalPlays).toBeDefined();
      expect(result.uniqueUsers).toBeDefined();
      expect(result.topGachas).toBeDefined();
    });

    it('should return user analytics', async () => {
      const queryDto = { vtuberId: mockUser.id }; // Use same user ID to pass validation
      
      const result = await service.getUserAnalytics(mockUser.id, queryDto);
      
      expect(result).toBeDefined();
      expect(result.totalUsers).toBeDefined();
      expect(result.retention).toBeDefined();
      expect(result.behavior).toBeDefined();
    });
  });
});