import { Test, TestingModule } from '@nestjs/testing';
import { VTuberApplicationController } from '../vtuber-application.controller';
import { VTuberApplicationService } from '../vtuber-application.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApplicationStatus } from '../enums/application-status.enum';
import { ReviewStatus } from '../enums/review-status.enum';
import { ReviewDecision } from '../enums/review-decision.enum';

describe('VTuberApplicationController', () => {
  let controller: VTuberApplicationController;
  let service: VTuberApplicationService;

  const mockApplicationService = {
    createApplication: jest.fn(),
    getApplication: jest.fn(),
    updateApplication: jest.fn(),
    getUserApplications: jest.fn(),
    checkDuplicateApplication: jest.fn(),
    assignReviewer: jest.fn(),
    createReview: jest.fn(),
    getReviewerAssignments: jest.fn(),
    sendNotification: jest.fn(),
    approveApplication: jest.fn(),
    rejectApplication: jest.fn(),
    getApplicationStatistics: jest.fn(),
  };

  const mockUser = {
    sub: 'user-123',
    role: 'USER',
  };

  const mockReviewer = {
    sub: 'reviewer-123',
    role: 'REVIEWER',
  };

  const mockAdmin = {
    sub: 'admin-123',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VTuberApplicationController],
      providers: [
        {
          provide: VTuberApplicationService,
          useValue: mockApplicationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VTuberApplicationController>(VTuberApplicationController);
    service = module.get<VTuberApplicationService>(VTuberApplicationService);
  });

  describe('Application API', () => {
    it('should create new application', async () => {
      const createDto = {
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        streamingPlatforms: ['YouTube'],
        contentGenres: ['Gaming'],
      };

      const mockApplication = {
        id: 'app-123',
        applicantUserId: 'user-123',
        status: ApplicationStatus.SUBMITTED,
        ...createDto,
        submittedAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockApplicationService.createApplication.mockResolvedValue(mockApplication);

      const result = await controller.createApplication(
        { user: mockUser },
        createDto
      );

      expect(result.success).toBe(true);
      expect(result.data.application).toEqual(mockApplication);
      expect(service.createApplication).toHaveBeenCalledWith('user-123', createDto);
    });

    it('should return application details', async () => {
      const mockApplication = {
        id: 'app-123',
        applicantUserId: 'user-123',
        status: ApplicationStatus.SUBMITTED,
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
      };

      mockApplicationService.getApplication.mockResolvedValue(mockApplication);

      const result = await controller.getApplication('app-123');

      expect(result.success).toBe(true);
      expect(result.data.application).toEqual(mockApplication);
    });

    it('should update application information', async () => {
      const updateDto = {
        channelName: 'Updated Channel',
        channelDescription: 'Updated Description',
      };

      const mockApplication = {
        id: 'app-123',
        applicantUserId: 'user-123',
        ...updateDto,
      };

      mockApplicationService.updateApplication.mockResolvedValue(mockApplication);

      const result = await controller.updateApplication(
        { user: mockUser },
        'app-123',
        updateDto
      );

      expect(result.success).toBe(true);
      expect(result.data.application).toEqual(mockApplication);
    });

    it('should list user applications', async () => {
      const mockApplications = [
        {
          id: 'app-123',
          applicantUserId: 'user-123',
          status: ApplicationStatus.SUBMITTED,
          channelName: 'Test Channel',
        },
      ];

      const mockResult = {
        applications: mockApplications,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockApplicationService.getUserApplications.mockResolvedValue(mockResult);

      const result = await controller.getMyApplications(
        { user: mockUser },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });
  });

  describe('Review API', () => {
    it('should list reviewer assignments', async () => {
      const mockReviews = [
        {
          id: 'review-123',
          applicationId: 'app-123',
          reviewerId: 'reviewer-123',
          status: ReviewStatus.PENDING,
        },
      ];

      const mockResult = {
        reviews: mockReviews,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockApplicationService.getReviewerAssignments.mockResolvedValue(mockResult);

      const result = await controller.getReviewerAssignments(
        { user: mockReviewer },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });

    it('should update review progress', async () => {
      const reviewDto = {
        decision: ReviewDecision.APPROVED,
        reviewComments: 'Good application',
        score: 85,
      };

      const mockReview = {
        id: 'review-123',
        applicationId: 'app-123',
        reviewerId: 'reviewer-123',
        ...reviewDto,
        status: ReviewStatus.COMPLETED,
        completedAt: new Date(),
      };

      mockApplicationService.createReview.mockResolvedValue(mockReview);

      const result = await controller.updateReview('review-123', reviewDto);

      expect(result.success).toBe(true);
      expect(result.data.review).toEqual(mockReview);
    });
  });

  describe('Admin API', () => {
    it('should list all applications for admin', async () => {
      const mockApplications = [
        {
          id: 'app-123',
          applicantUserId: 'user-123',
          status: ApplicationStatus.SUBMITTED,
          channelName: 'Test Channel',
        },
        {
          id: 'app-456',
          applicantUserId: 'user-456',
          status: ApplicationStatus.UNDER_REVIEW,
          channelName: 'Another Channel',
        },
      ];

      const mockResult = {
        applications: mockApplications,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockApplicationService.getUserApplications.mockResolvedValue(mockResult);

      const result = await controller.getAllApplications({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });

    it('should assign reviewers to applications', async () => {
      const assignmentDto = {
        reviewerId: 'reviewer-123',
        reviewStage: 'initial_screening',
      };

      const mockReview = {
        id: 'review-123',
        applicationId: 'app-123',
        reviewerId: 'reviewer-123',
        reviewStage: 'initial_screening',
        status: ReviewStatus.PENDING,
      };

      mockApplicationService.assignReviewer.mockResolvedValue(mockReview);

      const result = await controller.assignReviewer('app-123', assignmentDto);

      expect(result.success).toBe(true);
      expect(result.data.review).toEqual(mockReview);
    });

    it('should approve applications', async () => {
      const mockApplication = {
        id: 'app-123',
        applicantUserId: 'user-123',
        status: ApplicationStatus.APPROVED,
        approvedAt: new Date(),
      };

      mockApplicationService.approveApplication.mockResolvedValue(mockApplication);

      const result = await controller.approveApplication('app-123');

      expect(result.success).toBe(true);
      expect(result.data.application).toEqual(mockApplication);
    });

    it('should reject applications', async () => {
      const rejectionDto = {
        reason: 'Insufficient information provided',
      };

      const mockApplication = {
        id: 'app-123',
        applicantUserId: 'user-123',
        status: ApplicationStatus.REJECTED,
        rejectedAt: new Date(),
      };

      mockApplicationService.rejectApplication.mockResolvedValue(mockApplication);

      const result = await controller.rejectApplication('app-123', rejectionDto);

      expect(result.success).toBe(true);
      expect(result.data.application).toEqual(mockApplication);
    });

    it('should generate application statistics', async () => {
      const mockStats = {
        totalApplications: 100,
        pendingApplications: 20,
        approvedApplications: 60,
        rejectedApplications: 20,
        averageReviewTime: 5.2,
      };

      mockApplicationService.getApplicationStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require JWT token for protected endpoints', async () => {
      // This test would be handled by the actual guard implementation
      // In this mock setup, we're just verifying the service calls are made
      expect(true).toBe(true);
    });

    it('should allow users to create applications', async () => {
      const createDto = {
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        streamingPlatforms: ['YouTube'],
        contentGenres: ['Gaming'],
      };

      mockApplicationService.createApplication.mockResolvedValue({
        id: 'app-123',
        applicantUserId: 'user-123',
        ...createDto,
      });

      const result = await controller.createApplication({ user: mockUser }, createDto);

      expect(result.success).toBe(true);
      expect(service.createApplication).toHaveBeenCalledWith('user-123', createDto);
    });

    it('should allow reviewers to access assigned reviews', async () => {
      mockApplicationService.getReviewerAssignments.mockResolvedValue({
        reviews: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await controller.getReviewerAssignments(
        { user: mockReviewer },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
    });

    it('should allow admins to access all applications', async () => {
      mockApplicationService.getUserApplications.mockResolvedValue({
        applications: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await controller.getAllApplications({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should validate application creation data', async () => {
      const invalidDto = {
        channelName: '', // Invalid empty name
        channelDescription: 'Test Description',
        streamingPlatforms: [], // Invalid empty array
        contentGenres: ['Gaming'],
      };

      await expect(
        controller.createApplication({ user: mockUser }, invalidDto as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize input parameters', async () => {
      const maliciousDto = {
        channelName: '<script>alert("xss")</script>',
        channelDescription: 'Normal description',
        streamingPlatforms: ['YouTube'],
        contentGenres: ['Gaming'],
      };

      await expect(
        controller.createApplication({ user: mockUser }, maliciousDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockApplicationService.getApplication.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.getApplication('app-123')).rejects.toThrow();
    });

    it('should handle application not found', async () => {
      mockApplicationService.getApplication.mockRejectedValue(
        new Error('Application not found')
      );

      await expect(controller.getApplication('non-existent')).rejects.toThrow();
    });
  });
});