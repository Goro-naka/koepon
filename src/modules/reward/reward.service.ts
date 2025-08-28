import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reward } from './entities/reward.entity';
import { UserReward } from './entities/user-reward.entity';
import { DownloadLog } from './entities/download-log.entity';
import { FileMetadata, StorageService, UploadResult } from './services/storage.service';
import { VirusScanService } from './services/virus-scan.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import {
  DownloadLimitExceededException,
  FileSizeExceededException,
  InvalidFileFormatException,
  RewardAccessDeniedException,
  RewardNotFoundException,
  VirusScanFailedException,
} from './exceptions/reward.exceptions';
import { RewardCategory } from './enums/reward-category.enum';

export interface RewardListResponse {
  rewards: Reward[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserRewardListResponse {
  rewards: UserReward[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresAt: Date;
  remainingDownloads: number;
}

export interface UploadRewardMetadata extends FileMetadata {
  downloadLimit?: number;
}

@Injectable()
export class RewardService {
  private readonly ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/aac',
    // Video
    'video/mp4',
    'video/quicktime',
    'video/webm',
    // Text
    'text/plain',
    'application/pdf',
  ];

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(UserReward)
    private readonly userRewardRepository: Repository<UserReward>,
    @InjectRepository(DownloadLog)
    private readonly downloadLogRepository: Repository<DownloadLog>,
    private readonly storageService: StorageService,
    private readonly virusScanService: VirusScanService,
    private readonly logger: CustomLoggerService,
  ) {}

  async uploadReward(file: Buffer, metadata: UploadRewardMetadata): Promise<Reward> {
    // Early validation - no async operations until validation passes
    if (metadata.size > this.MAX_FILE_SIZE) {
      throw new FileSizeExceededException(metadata.size, this.MAX_FILE_SIZE);
    }

    if (!this.ALLOWED_MIME_TYPES.includes(metadata.mimeType)) {
      throw new InvalidFileFormatException(metadata.mimeType);
    }

    // Only proceed with async operations after validation
    const scanResult = await this.virusScanService.scanFile(file);
    if (!scanResult.isClean) {
      throw new VirusScanFailedException(scanResult.threats || ['Unknown threat']);
    }

    const fileExtension = this.getFileExtension(metadata.originalName);
    const storageKey = `rewards/${metadata.vtuberId}/${Date.now()}-${metadata.originalName}`;
    const uploadResult = await this.storageService.uploadFile(file, storageKey, metadata);
    const category = this.getCategoryFromMimeType(metadata.mimeType);

    const reward = this.rewardRepository.create({
      vtuberId: metadata.vtuberId,
      name: metadata.name,
      description: metadata.description || '',
      category,
      fileUrl: uploadResult.url,
      fileName: metadata.originalName,
      fileSize: metadata.size,
      mimeType: metadata.mimeType,
      downloadLimit: metadata.downloadLimit || 3,
      isActive: true,
    });

    const savedReward = await this.rewardRepository.save(reward);

    this.logger.log(
      `Reward uploaded successfully: ${savedReward.id} for VTuber ${metadata.vtuberId}`,
      'RewardService'
    );

    return savedReward;
  }

  async findAll(query: any): Promise<RewardListResponse> {
    const { page = 1, limit = 10, vtuberId, category, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.rewardRepository.createQueryBuilder('reward');

    if (vtuberId) {
      queryBuilder.andWhere('reward.vtuberId = :vtuberId', { vtuberId });
    }

    if (category) {
      queryBuilder.andWhere('reward.category = :category', { category });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('reward.isActive = :isActive', { isActive });
    }

    const [rewards, total] = await queryBuilder
      .orderBy('reward.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id } });

    if (!reward) {
      throw new RewardNotFoundException(id);
    }

    return reward;
  }

  async getUserRewards(userId: string, query: any): Promise<UserRewardListResponse> {
    const { page = 1, limit = 10, category, vtuberId } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRewardRepository
      .createQueryBuilder('userReward')
      .leftJoinAndSelect('userReward.reward', 'reward')
      .where('userReward.userId = :userId', { userId });

    if (category) {
      queryBuilder.andWhere('reward.category = :category', { category });
    }

    if (vtuberId) {
      queryBuilder.andWhere('reward.vtuberId = :vtuberId', { vtuberId });
    }

    const [rewards, total] = await queryBuilder
      .orderBy('userReward.acquiredAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      rewards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async generateDownloadUrl(userId: string, rewardId: string): Promise<DownloadUrlResponse> {
    // Find user's reward
    const userReward = await this.userRewardRepository.findOne({
      where: { userId, rewardId },
      relations: ['reward'],
    });

    if (!userReward) {
      throw new RewardAccessDeniedException(rewardId);
    }

    // Check daily download limit
    const today = new Date().toDateString();
    const lastDownloadDate = userReward.lastDownloadDate?.toDateString();
    
    let dailyDownloadCount = userReward.dailyDownloadCount;
    if (lastDownloadDate !== today) {
      // Reset daily counter for new day
      dailyDownloadCount = 0;
    }

    if (dailyDownloadCount >= userReward.reward.downloadLimit) {
      throw new DownloadLimitExceededException(rewardId, userReward.reward.downloadLimit);
    }

    // Extract storage key from file URL
    const storageKey = this.extractStorageKey(userReward.reward.fileUrl);

    // Generate signed URL (24 hours expiration)
    const expirationTime = 24 * 60 * 60; // 24 hours in seconds
    const downloadUrl = await this.storageService.generateSignedUrl(storageKey, expirationTime);

    // Update download tracking
    const now = new Date();
    userReward.downloadCount += 1;
    userReward.dailyDownloadCount = dailyDownloadCount + 1;
    userReward.lastDownloadAt = now;
    userReward.lastDownloadDate = now;

    if (!userReward.firstDownloadAt) {
      userReward.firstDownloadAt = now;
    }

    await this.userRewardRepository.save(userReward);

    // Create download log
    const downloadLog = this.downloadLogRepository.create({
      userId,
      rewardId,
      userRewardId: userReward.id,
      downloadUrl,
      userAgent: 'Unknown', // Would be populated from request headers
      ipAddress: '0.0.0.0', // Would be populated from request
      fileSize: userReward.reward.fileSize,
    });

    await this.downloadLogRepository.save(downloadLog);

    const expiresAt = new Date(Date.now() + expirationTime * 1000);
    const remainingDownloads = userReward.reward.downloadLimit - userReward.dailyDownloadCount;

    return {
      downloadUrl,
      expiresAt,
      remainingDownloads,
    };
  }

  async getDownloadHistory(userId: string, query: any): Promise<any> {
    const { page = 1, limit = 20, rewardId } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.downloadLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.reward', 'reward')
      .where('log.userId = :userId', { userId });

    if (rewardId) {
      queryBuilder.andWhere('log.rewardId = :rewardId', { rewardId });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.downloadedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateData: Partial<Reward>): Promise<Reward> {
    const reward = await this.findOne(id);
    
    Object.assign(reward, updateData);
    return await this.rewardRepository.save(reward);
  }

  async remove(id: string): Promise<void> {
    const reward = await this.findOne(id);
    
    // Extract storage key and delete from storage
    const storageKey = this.extractStorageKey(reward.fileUrl);
    await this.storageService.deleteFile(storageKey);

    // Soft delete by marking as inactive
    await this.rewardRepository.update(id, { isActive: false });
  }

  async awardReward(userId: string, rewardId: string, source: 'gacha' | 'exchange', sourceId: string): Promise<UserReward> {
    // Verify reward exists
    const reward = await this.findOne(rewardId);

    // Create user reward record
    const userReward = this.userRewardRepository.create({
      userId,
      rewardId,
      gachaResultId: source === 'gacha' ? sourceId : undefined,
      exchangeTransactionId: source === 'exchange' ? sourceId : undefined,
      downloadCount: 0,
      dailyDownloadCount: 0,
      lastDownloadDate: new Date(),
    });

    return await this.userRewardRepository.save(userReward);
  }

  private getCategoryFromMimeType(mimeType: string): RewardCategory {
    if (mimeType.startsWith('image/')) return RewardCategory.IMAGE;
    if (mimeType.startsWith('audio/')) return RewardCategory.AUDIO;
    if (mimeType.startsWith('video/')) return RewardCategory.VIDEO;
    return RewardCategory.TEXT;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private extractStorageKey(fileUrl: string): string {
    // Extract key from S3 URL
    const url = new URL(fileUrl);
    return url.pathname.substring(1); // Remove leading slash
  }
}