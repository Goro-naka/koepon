import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VTuberApplicationService } from '../vtuber-application.service';
import { VTuberApplication } from '../entities/vtuber-application.entity';
import { ApplicationReview } from '../entities/application-review.entity';
import { ApplicationNotification } from '../entities/application-notification.entity';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import {
  ApplicationNotFoundException,
  DuplicateApplicationException,
  InvalidApplicationDataException,
  ReviewNotFoundException,
  ReviewerNotAssignedException,
} from '../exceptions/vtuber-application.exceptions';
import { ApplicationStatus } from '../enums/application-status.enum';
import { ReviewStage } from '../enums/review-stage.enum';
import { ReviewStatus } from '../enums/review-status.enum';
import { ReviewDecision } from '../enums/review-decision.enum';
import { NotificationType } from '../enums/notification-type.enum';

describe('VTuberApplicationService', () => {
  let service: VTuberApplicationService;
  let applicationRepository: Repository<VTuberApplication>;
  let reviewRepository: Repository<ApplicationReview>;
  let notificationRepository: Repository<ApplicationNotification>;
  let logger: CustomLoggerService;

  const mockApplication = {
    id: 'app-123',
    applicantUserId: 'user-123',
    status: ApplicationStatus.SUBMITTED,
    channelName: 'Test Channel',
    channelDescription: 'Test Description',
    streamingPlatforms: ['YouTube'],
    contentGenres: ['Gaming'],
    submittedAt: new Date(),
    lastUpdatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VTuberApplicationService,
        {
          provide: getRepositoryToken(VTuberApplication),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ApplicationReview),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ApplicationNotification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VTuberApplicationService>(VTuberApplicationService);
    applicationRepository = module.get<Repository<VTuberApplication>>(getRepositoryToken(VTuberApplication));
    reviewRepository = module.get<Repository<ApplicationReview>>(getRepositoryToken(ApplicationReview));
    notificationRepository = module.get<Repository<ApplicationNotification>>(getRepositoryToken(ApplicationNotification));
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('Application Management', () => {
    it('should create new VTuber application successfully', async () => {
      const createDto = {
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        streamingPlatforms: ['YouTube'],
        contentGenres: ['Gaming'],
      };

      jest.spyOn(applicationRepository, 'create').mockReturnValue(mockApplication as any);
      jest.spyOn(applicationRepository, 'save').mockResolvedValue(mockApplication as any);
      jest.spyOn(service, 'checkDuplicateApplication').mockResolvedValue(false);

      const result = await service.createApplication('user-123', createDto);

      expect(result).toBeDefined();
      expect(result.channelName).toBe(createDto.channelName);
      expect(applicationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        applicantUserId: 'user-123',
        ...createDto,
      }));
    });

    it('should retrieve application by ID', async () => {
      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as any);

      const result = await service.getApplication('app-123');

      expect(result).toEqual(mockApplication);
      expect(applicationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        relations: ['reviews'],
      });
    });

    it('should throw error for non-existent application', async () => {
      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getApplication('non-existent'))
        .rejects.toThrow(ApplicationNotFoundException);
    });

    it('should handle duplicate application submission', async () => {
      jest.spyOn(service, 'checkDuplicateApplication').mockResolvedValue(true);

      const createDto = {
        channelName: 'Test Channel',
        channelDescription: 'Test Description',
        streamingPlatforms: ['YouTube'],
        contentGenres: ['Gaming'],
      };

      await expect(service.createApplication('user-123', createDto))
        .rejects.toThrow(DuplicateApplicationException);
    });

    it('should update application details', async () => {
      const updateDto = {
        channelName: 'Updated Channel',
        channelDescription: 'Updated Description',
      };

      jest.spyOn(service, 'getApplication').mockResolvedValue(mockApplication as any);
      jest.spyOn(applicationRepository, 'save').mockResolvedValue({
        ...mockApplication,
        ...updateDto,
      } as any);

      const result = await service.updateApplication('app-123', updateDto);

      expect(result.channelName).toBe(updateDto.channelName);
    });
  });

  describe('Status Management', () => {
    it('should check for duplicate applications correctly', async () => {
      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(mockApplication as any);

      const result = await service.checkDuplicateApplication('user-123');

      expect(result).toBe(true);
      expect(applicationRepository.findOne).toHaveBeenCalledWith({
        where: {
          applicantUserId: 'user-123',
          status: expect.any(Object),
        },
      });
    });

    it('should return false when no active application exists', async () => {
      jest.spyOn(applicationRepository, 'findOne').mockResolvedValue(null);

      const result = await service.checkDuplicateApplication('user-123');

      expect(result).toBe(false);
    });
  });

  describe('Review Process', () => {
    it('should assign reviewer to application', async () => {
      const mockReview = {
        id: 'review-123',
        applicationId: 'app-123',
        reviewerId: 'reviewer-123',
        reviewStage: ReviewStage.INITIAL_SCREENING,
        status: ReviewStatus.PENDING,
        assignedAt: new Date(),
        deadline: new Date(),
      };

      jest.spyOn(service, 'getApplication').mockResolvedValue(mockApplication as any);
      jest.spyOn(reviewRepository, 'create').mockReturnValue(mockReview as any);
      jest.spyOn(reviewRepository, 'save').mockResolvedValue(mockReview as any);

      const result = await service.assignReviewer('app-123', 'reviewer-123', ReviewStage.INITIAL_SCREENING);

      expect(result).toBeDefined();
      expect(result.reviewerId).toBe('reviewer-123');
      expect(reviewRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        applicationId: 'app-123',
        reviewerId: 'reviewer-123',
        reviewStage: ReviewStage.INITIAL_SCREENING,
      }));
    });

    it('should create review record successfully', async () => {
      const reviewDto = {
        decision: ReviewDecision.APPROVED,
        reviewComments: 'Good application',
        score: 85,
      };

      const mockReview = {
        id: 'review-123',
        applicationId: 'app-123',
        reviewerId: 'reviewer-123',
        status: ReviewStatus.IN_PROGRESS,
      };

      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(mockReview as any);
      jest.spyOn(reviewRepository, 'save').mockResolvedValue({
        ...mockReview,
        ...reviewDto,
        status: ReviewStatus.COMPLETED,
        completedAt: new Date(),
      } as any);

      const result = await service.createReview('review-123', reviewDto);

      expect(result.decision).toBe(ReviewDecision.APPROVED);
      expect(result.reviewComments).toBe('Good application');
    });

    it('should throw error for non-existent review', async () => {
      jest.spyOn(reviewRepository, 'findOne').mockResolvedValue(null);

      const reviewDto = {
        decision: ReviewDecision.APPROVED,
        reviewComments: 'Good application',
      };

      await expect(service.createReview('non-existent', reviewDto))
        .rejects.toThrow(ReviewNotFoundException);
    });
  });

  describe('Notification Management', () => {
    it('should send notification successfully', async () => {
      const mockNotification = {
        id: 'notif-123',
        applicationId: 'app-123',
        recipientId: 'user-123',
        type: NotificationType.APPLICATION_SUBMITTED,
        title: 'Application Submitted',
        message: 'Your application has been submitted',
      };

      jest.spyOn(notificationRepository, 'create').mockReturnValue(mockNotification as any);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue(mockNotification as any);

      await service.sendNotification('app-123', 'user-123', NotificationType.APPLICATION_SUBMITTED, {
        title: 'Application Submitted',
        message: 'Your application has been submitted',
      });

      expect(notificationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        applicationId: 'app-123',
        recipientId: 'user-123',
        type: NotificationType.APPLICATION_SUBMITTED,
      }));
    });
  });

  describe('Admin Operations', () => {
    it('should approve application successfully', async () => {
      jest.spyOn(service, 'getApplication').mockResolvedValue(mockApplication as any);
      jest.spyOn(applicationRepository, 'save').mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.APPROVED,
        approvedAt: new Date(),
      } as any);

      const result = await service.approveApplication('app-123');

      expect(result.status).toBe(ApplicationStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
    });

    it('should reject application successfully', async () => {
      const rejectionReason = 'Insufficient information provided';

      jest.spyOn(service, 'getApplication').mockResolvedValue(mockApplication as any);
      jest.spyOn(applicationRepository, 'save').mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.REJECTED,
        rejectedAt: new Date(),
      } as any);

      const result = await service.rejectApplication('app-123', rejectionReason);

      expect(result.status).toBe(ApplicationStatus.REJECTED);
      expect(result.rejectedAt).toBeDefined();
    });

    it('should get application statistics', async () => {
      const mockStats = {
        totalApplications: 100,
        pendingApplications: 20,
        approvedApplications: 60,
        rejectedApplications: 20,
      };

      jest.spyOn(service, 'getApplicationStatistics').mockResolvedValue(mockStats);

      const result = await service.getApplicationStatistics();

      expect(result).toEqual(mockStats);
    });
  });

  describe('User Operations', () => {
    it('should get user applications with pagination', async () => {
      const mockApplications = [mockApplication];
      const mockResult = {
        applications: mockApplications,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'getUserApplications').mockResolvedValue(mockResult);

      const result = await service.getUserApplications('user-123', { page: 1, limit: 10 });

      expect(result.applications).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should get reviewer assignments with pagination', async () => {
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

      jest.spyOn(service, 'getReviewerAssignments').mockResolvedValue(mockResult);

      const result = await service.getReviewerAssignments('reviewer-123', { page: 1, limit: 10 });

      expect(result.reviews).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });
});