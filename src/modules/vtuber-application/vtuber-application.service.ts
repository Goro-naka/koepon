import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { VTuberApplication } from './entities/vtuber-application.entity';
import { ApplicationReview } from './entities/application-review.entity';
import { ApplicationNotification } from './entities/application-notification.entity';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto, PaginationResult } from './dto/pagination.dto';
import {
  ApplicationNotFoundException,
  DuplicateApplicationException,
  ReviewNotFoundException,
} from './exceptions/vtuber-application.exceptions';
import { ApplicationStatus } from './enums/application-status.enum';
import { ReviewStatus } from './enums/review-status.enum';
import { ReviewStage } from './enums/review-stage.enum';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationStatus } from './enums/notification-status.enum';

@Injectable()
export class VTuberApplicationService {
  constructor(
    @InjectRepository(VTuberApplication)
    private applicationRepository: Repository<VTuberApplication>,
    @InjectRepository(ApplicationReview)
    private reviewRepository: Repository<ApplicationReview>,
    @InjectRepository(ApplicationNotification)
    private notificationRepository: Repository<ApplicationNotification>,
    private logger: CustomLoggerService,
  ) {}

  async createApplication(userId: string, createDto: CreateApplicationDto): Promise<VTuberApplication> {
    this.logger.log(`Creating application for user ${userId}`);
    
    const hasDuplicate = await this.checkDuplicateApplication(userId);
    if (hasDuplicate) {
      this.logger.warn(`Duplicate application attempt by user ${userId}`);
      throw new DuplicateApplicationException(userId);
    }

    const application = this.applicationRepository.create({
      applicantUserId: userId,
      ...createDto,
      status: ApplicationStatus.SUBMITTED,
      reviewDeadline: this.calculateReviewDeadline(),
    });

    const savedApplication = await this.applicationRepository.save(application);
    
    // Send notification asynchronously
    this.sendNotificationSafe(savedApplication.id, userId, NotificationType.APPLICATION_SUBMITTED, {
      title: 'Application Submitted',
      message: 'Your VTuber application has been submitted successfully',
    });

    this.logger.log(`Application created successfully: ${savedApplication.id}`);
    return savedApplication;
  }

  private calculateReviewDeadline(): Date {
    return new Date(Date.now() + 21 * 24 * 60 * 60 * 1000); // 21 days from now
  }

  private async sendNotificationSafe(applicationId: string, recipientId: string, type: NotificationType, data: any): Promise<void> {
    try {
      await this.sendNotification(applicationId, recipientId, type, data);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }

  async getApplication(id: string): Promise<VTuberApplication> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['reviews'],
    });

    if (!application) {
      throw new ApplicationNotFoundException(id);
    }

    return application;
  }

  async updateApplication(id: string, updateDto: UpdateApplicationDto): Promise<VTuberApplication> {
    const application = await this.getApplication(id);
    Object.assign(application, updateDto);
    return await this.applicationRepository.save(application);
  }

  async getUserApplications(userId: string, pagination: PaginationDto): Promise<{ applications: VTuberApplication[], pagination: PaginationResult }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [applications, total] = await this.applicationRepository.findAndCount({
      where: { applicantUserId: userId },
      order: { submittedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkDuplicateApplication(userId: string): Promise<boolean> {
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        applicantUserId: userId,
        status: In([ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW]),
      },
    });

    return !!existingApplication;
  }

  async assignReviewer(applicationId: string, reviewerId: string, stage: ReviewStage): Promise<ApplicationReview> {
    await this.getApplication(applicationId); // Verify application exists

    const review = this.reviewRepository.create({
      applicationId,
      reviewerId,
      reviewStage: stage,
      status: ReviewStatus.PENDING,
      assignedAt: new Date(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    return await this.reviewRepository.save(review);
  }

  async createReview(reviewId: string, reviewDto: CreateReviewDto): Promise<ApplicationReview> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    Object.assign(review, {
      ...reviewDto,
      status: ReviewStatus.COMPLETED,
      completedAt: new Date(),
    });

    return await this.reviewRepository.save(review);
  }

  async getReviewerAssignments(reviewerId: string, pagination: PaginationDto): Promise<{ reviews: ApplicationReview[], pagination: PaginationResult }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { reviewerId },
      order: { assignedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async sendNotification(applicationId: string, recipientId: string, type: NotificationType, data: any): Promise<void> {
    const notification = this.notificationRepository.create({
      applicationId,
      recipientId,
      type,
      title: data.title,
      message: data.message,
      status: NotificationStatus.PENDING,
    });

    await this.notificationRepository.save(notification);
  }

  async approveApplication(applicationId: string): Promise<VTuberApplication> {
    const application = await this.getApplication(applicationId);
    application.status = ApplicationStatus.APPROVED;
    application.approvedAt = new Date();
    return await this.applicationRepository.save(application);
  }

  async rejectApplication(applicationId: string, reason: string): Promise<VTuberApplication> {
    const application = await this.getApplication(applicationId);
    application.status = ApplicationStatus.REJECTED;
    application.rejectedAt = new Date();
    return await this.applicationRepository.save(application);
  }

  async getApplicationStatistics(): Promise<any> {
    const totalApplications = await this.applicationRepository.count();
    const pendingApplications = await this.applicationRepository.count({
      where: { status: ApplicationStatus.SUBMITTED },
    });
    const approvedApplications = await this.applicationRepository.count({
      where: { status: ApplicationStatus.APPROVED },
    });
    const rejectedApplications = await this.applicationRepository.count({
      where: { status: ApplicationStatus.REJECTED },
    });

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
    };
  }
}