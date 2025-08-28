import { Test, TestingModule } from '@nestjs/testing';
import { RewardController } from '../reward.controller';
import { RewardService } from '../reward.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  DownloadLimitExceededException,
  RewardNotFoundException,
} from '../exceptions/reward.exceptions';

describe('RewardController', () => {
  let controller: RewardController;
  let service: RewardService;

  const mockRewardService = {
    uploadReward: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getUserRewards: jest.fn(),
    generateDownloadUrl: jest.fn(),
    getDownloadHistory: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    sub: 'user-123',
    role: 'VTUBER',
    vtuberId: 'vtuber-123',
  };

  const mockAdminUser = {
    sub: 'admin-123',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RewardController],
      providers: [
        {
          provide: RewardService,
          useValue: mockRewardService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RewardController>(RewardController);
    service = module.get<RewardService>(RewardService);
  });

  describe('File Upload API', () => {
    it('should handle multipart file upload', async () => {
      const file = {
        buffer: Buffer.from('fake image data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
      };

      const createDto = {
        name: 'Test Reward',
        description: 'Test Description',
        downloadLimit: 3,
      };

      const expectedReward = {
        id: 'reward-123',
        ...createDto,
        category: 'image',
        fileUrl: 'https://storage.example.com/test.jpg',
      };

      mockRewardService.uploadReward.mockResolvedValue(expectedReward);

      const result = await controller.uploadReward(
        { user: mockUser },
        file as any,
        createDto
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedReward);
      expect(service.uploadReward).toHaveBeenCalledWith(
        file.buffer,
        expect.objectContaining({
          vtuberId: mockUser.vtuberId,
          name: createDto.name,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        })
      );
    });

    it('should validate file format and size', async () => {
      const file = {
        buffer: Buffer.from('fake executable data'),
        originalname: 'virus.exe',
        mimetype: 'application/x-executable',
        size: 1024,
      };

      const createDto = {
        name: 'Malicious File',
        description: 'Test Description',
        downloadLimit: 3,
      };

      await expect(
        controller.uploadReward({ user: mockUser }, file as any, createDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should require VTuber or Admin role', async () => {
      const file = {
        buffer: Buffer.from('fake image data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
      };

      const createDto = {
        name: 'Test Reward',
        description: 'Test Description',
        downloadLimit: 3,
      };

      const regularUser = { sub: 'user-123', role: 'USER' };

      await expect(
        controller.uploadReward({ user: regularUser }, file as any, createDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Reward Box API', () => {
    it('should return user reward list', async () => {
      const mockRewards = {
        rewards: [
          {
            id: 'user-reward-1',
            reward: {
              id: 'reward-123',
              name: 'Test Reward',
              category: 'image',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockRewardService.getUserRewards.mockResolvedValue(mockRewards);

      const result = await controller.getUserRewards(
        { user: mockUser },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRewards);
    });

    it('should handle pagination parameters', async () => {
      const query = { page: 2, limit: 5, category: 'image' };
      
      mockRewardService.getUserRewards.mockResolvedValue({
        rewards: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
      });

      await controller.getUserRewards({ user: mockUser }, query);

      expect(service.getUserRewards).toHaveBeenCalledWith(mockUser.sub, query);
    });
  });

  describe('Download API', () => {
    it('should generate download URL for owned reward', async () => {
      const downloadResponse = {
        downloadUrl: 'https://signed-url.com',
        expiresAt: new Date(),
        remainingDownloads: 2,
      };

      mockRewardService.generateDownloadUrl.mockResolvedValue(downloadResponse);

      const result = await controller.generateDownloadUrl(
        { user: mockUser },
        'reward-123'
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(downloadResponse);
    });

    it('should reject download for unowned reward', async () => {
      mockRewardService.generateDownloadUrl.mockRejectedValue(
        new RewardNotFoundException('reward-123')
      );

      await expect(
        controller.generateDownloadUrl({ user: mockUser }, 'reward-123')
      ).rejects.toThrow(RewardNotFoundException);
    });

    it('should respect daily download limits', async () => {
      mockRewardService.generateDownloadUrl.mockRejectedValue(
        new DownloadLimitExceededException('reward-123', 3)
      );

      await expect(
        controller.generateDownloadUrl({ user: mockUser }, 'reward-123')
      ).rejects.toThrow(DownloadLimitExceededException);
    });
  });

  describe('Admin Functionality', () => {
    it('should allow admin to manage all rewards', async () => {
      const rewards = {
        rewards: [
          {
            id: 'reward-123',
            vtuberId: 'vtuber-123',
            name: 'Test Reward',
            description: 'Test Description',
            category: 'image',
            fileUrl: 'https://storage.example.com/file.jpg',
            fileName: 'test.jpg',
            fileSize: 1024000,
            mimeType: 'image/jpeg',
            downloadLimit: 3,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      mockRewardService.findAll.mockResolvedValue(rewards);

      const result = await controller.findAll(
        { user: mockAdminUser },
        { page: 1, limit: 10 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(rewards);
    });

    it('should allow admin to delete any reward', async () => {
      mockRewardService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(
        { user: mockAdminUser },
        'reward-123'
      );

      expect(result.success).toBe(true);
      expect(service.remove).toHaveBeenCalledWith('reward-123');
    });
  });
});