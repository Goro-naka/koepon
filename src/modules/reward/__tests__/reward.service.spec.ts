import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { RewardService } from '../reward.service';
import { Reward } from '../entities/reward.entity';
import { UserReward } from '../entities/user-reward.entity';
import { DownloadLog } from '../entities/download-log.entity';
import { StorageService } from '../services/storage.service';
import { VirusScanService } from '../services/virus-scan.service';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import {
  DownloadLimitExceededException,
  FileSizeExceededException,
  InvalidFileFormatException,
  RewardNotFoundException,
} from '../exceptions/reward.exceptions';
import { RewardCategory } from '../enums/reward-category.enum';

describe('RewardService', () => {
  let service: RewardService;
  let rewardRepository: Repository<Reward>;
  let userRewardRepository: Repository<UserReward>;
  let downloadLogRepository: Repository<DownloadLog>;
  let storageService: StorageService;
  let virusScanService: VirusScanService;
  let logger: CustomLoggerService;

  const mockReward = {
    id: 'reward-123',
    vtuberId: 'vtuber-123',
    name: 'Test Reward',
    description: 'Test Description',
    category: RewardCategory.IMAGE,
    fileUrl: 'https://storage.example.com/file.jpg',
    fileName: 'test.jpg',
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    downloadLimit: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        {
          provide: getRepositoryToken(Reward),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(UserReward),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(DownloadLog),
          useClass: Repository,
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
            generateSignedUrl: jest.fn(),
            deleteFile: jest.fn(),
            getFileMetadata: jest.fn(),
          },
        },
        {
          provide: VirusScanService,
          useValue: {
            scanFile: jest.fn(),
            quarantineFile: jest.fn(),
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

    service = module.get<RewardService>(RewardService);
    rewardRepository = module.get<Repository<Reward>>(getRepositoryToken(Reward));
    userRewardRepository = module.get<Repository<UserReward>>(getRepositoryToken(UserReward));
    downloadLogRepository = module.get<Repository<DownloadLog>>(getRepositoryToken(DownloadLog));
    storageService = module.get<StorageService>(StorageService);
    virusScanService = module.get<VirusScanService>(VirusScanService);
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('File Upload', () => {
    it('should upload valid image file successfully', async () => {
      const file = Buffer.from('fake image data');
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Test Image',
        description: 'Test Description',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
      };

      jest.spyOn(virusScanService, 'scanFile').mockResolvedValue({ isClean: true });
      jest.spyOn(storageService, 'uploadFile').mockResolvedValue({
        key: 'rewards/vtuber-123/test.jpg',
        url: 'https://storage.example.com/test.jpg',
      });
      jest.spyOn(rewardRepository, 'create').mockReturnValue(mockReward as any);
      jest.spyOn(rewardRepository, 'save').mockResolvedValue(mockReward as any);

      const result = await service.uploadReward(file, metadata);

      expect(result).toBeDefined();
      expect(result.category).toBe(RewardCategory.IMAGE);
      expect(virusScanService.scanFile).toHaveBeenCalledWith(file);
      expect(storageService.uploadFile).toHaveBeenCalled();
    });

    it('should reject invalid file format', async () => {
      const file = Buffer.from('fake executable data');
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Test File',
        description: 'Test Description',
        originalName: 'test.exe',
        mimeType: 'application/x-executable',
        size: 1024,
      };

      await expect(service.uploadReward(file, metadata)).rejects.toThrow(InvalidFileFormatException);
    });

    it('should reject oversized files (>50MB)', async () => {
      const file = Buffer.from('fake large file data');
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Large File',
        description: 'Test Description',
        originalName: 'large.jpg',
        mimeType: 'image/jpeg',
        size: 52428800, // 50MB + 1KB
      };

      try {
        await service.uploadReward(file, metadata);
        fail('Should have thrown FileSizeExceededException');
      } catch (error) {
        expect(error).toBeInstanceOf(FileSizeExceededException);
        expect(error.message).toContain('exceeds maximum allowed size');
      }
    });

    it('should reject files with malicious content', async () => {
      const file = Buffer.from('malicious content');
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Malicious File',
        description: 'Test Description',
        originalName: 'virus.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      };

      jest.spyOn(virusScanService, 'scanFile').mockResolvedValue({ 
        isClean: false, 
        threats: ['Trojan.Generic'] 
      });

      await expect(service.uploadReward(file, metadata)).rejects.toThrow(Error);
    });
  });

  describe('Signed URL Generation', () => {
    it('should generate signed URL with 24h expiration', async () => {
      const userReward = {
        id: 'user-reward-123',
        userId: 'user-123',
        rewardId: 'reward-123',
        dailyDownloadCount: 0,
        downloadCount: 0,
        lastDownloadDate: new Date('2025-01-01'),
        reward: mockReward,
      };

      jest.spyOn(userRewardRepository, 'findOne').mockResolvedValue(userReward as any);
      jest.spyOn(storageService, 'generateSignedUrl').mockResolvedValue('https://signed-url.com');
      jest.spyOn(userRewardRepository, 'save').mockImplementation(async (entity) => {
        return { ...userReward, ...entity } as any;
      });
      jest.spyOn(downloadLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(downloadLogRepository, 'save').mockResolvedValue({} as any);

      const result = await service.generateDownloadUrl('user-123', 'reward-123');

      expect(result.downloadUrl).toBe('https://signed-url.com');
      expect(storageService.generateSignedUrl).toHaveBeenCalledWith(
        expect.any(String),
        24 * 60 * 60 // 24 hours in seconds
      );
    });

    it('should reject downloads exceeding daily limit', async () => {
      const userReward = {
        id: 'user-reward-123',
        userId: 'user-123',
        rewardId: 'reward-123',
        dailyDownloadCount: 3,
        lastDownloadDate: new Date(),
        reward: { ...mockReward, downloadLimit: 3 },
      };

      jest.spyOn(userRewardRepository, 'findOne').mockResolvedValue(userReward as any);

      await expect(service.generateDownloadUrl('user-123', 'reward-123'))
        .rejects.toThrow(DownloadLimitExceededException);
    });
  });

  describe('Reward Box Management', () => {
    it('should list user rewards with pagination', async () => {
      const userRewards = [
        { id: '1', userId: 'user-123', reward: mockReward },
        { id: '2', userId: 'user-123', reward: { ...mockReward, id: 'reward-456' } },
      ];

      jest.spyOn(userRewardRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([userRewards, 2]),
      } as any);

      const result = await service.getUserRewards('user-123', { page: 1, limit: 10 });

      expect(result.rewards).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter rewards by category', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      jest.spyOn(userRewardRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      await service.getUserRewards('user-123', { 
        category: RewardCategory.IMAGE,
        page: 1, 
        limit: 10 
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'reward.category = :category',
        { category: RewardCategory.IMAGE }
      );
    });
  });

  describe('Download Control', () => {
    it('should track download history correctly', async () => {
      const userReward = {
        id: 'user-reward-123',
        userId: 'user-123',
        rewardId: 'reward-123',
        dailyDownloadCount: 0,
        downloadCount: 0,
        lastDownloadDate: new Date('2025-01-01'),
        reward: mockReward,
      };

      jest.spyOn(userRewardRepository, 'findOne').mockResolvedValue(userReward as any);
      jest.spyOn(storageService, 'generateSignedUrl').mockResolvedValue('https://signed-url.com');
      jest.spyOn(userRewardRepository, 'save').mockImplementation(async (entity) => {
        return { ...userReward, ...entity } as any;
      });
      jest.spyOn(downloadLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(downloadLogRepository, 'save').mockResolvedValue({} as any);

      await service.generateDownloadUrl('user-123', 'reward-123');

      expect(userRewardRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          downloadCount: 1,
          dailyDownloadCount: 1,
        })
      );
    });

    it('should reset daily counter for new day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userReward = {
        id: 'user-reward-123',
        userId: 'user-123',
        rewardId: 'reward-123',
        dailyDownloadCount: 3,
        downloadCount: 10,
        lastDownloadDate: yesterday,
        reward: mockReward,
      };

      jest.spyOn(userRewardRepository, 'findOne').mockResolvedValue(userReward as any);
      jest.spyOn(storageService, 'generateSignedUrl').mockResolvedValue('https://signed-url.com');
      jest.spyOn(userRewardRepository, 'save').mockImplementation(async (entity) => {
        return { ...userReward, ...entity } as any;
      });
      jest.spyOn(downloadLogRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(downloadLogRepository, 'save').mockResolvedValue({} as any);

      await service.generateDownloadUrl('user-123', 'reward-123');

      expect(userRewardRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyDownloadCount: 1, // Reset to 1 for new day
        })
      );
    });
  });
});