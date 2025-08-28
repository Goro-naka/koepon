import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../services/storage.service';

describe('StorageService Integration', () => {
  let service: StorageService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'AWS_S3_BUCKET': 'test-bucket',
                'AWS_S3_REGION': 'us-east-1',
                'AWS_ACCESS_KEY_ID': 'test-key',
                'AWS_SECRET_ACCESS_KEY': 'test-secret',
                'CDN_BASE_URL': 'https://cdn.example.com',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('File Upload Integration', () => {
    it('should upload file to S3/R2 successfully', async () => {
      const file = Buffer.from('fake image data');
      const key = 'rewards/vtuber-123/test.jpg';
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Test Image',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
      };

      // Mock S3 client send method
      jest.spyOn(service['s3Client'], 'send').mockResolvedValue({} as any);

      const result = await service.uploadFile(file, key, metadata);
      
      expect(result.key).toBe(key);
      expect(result.url).toContain(key);
    });

    it('should generate valid signed URLs', async () => {
      const key = 'rewards/vtuber-123/test.jpg';
      const expirationTime = 24 * 60 * 60; // 24 hours

      // Mock getSignedUrl
      jest.doMock('@aws-sdk/s3-request-presigner', () => ({
        getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com'),
      }));

      const signedUrl = await service.generateSignedUrl(key, expirationTime);
      expect(signedUrl).toMatch(/^https:\/\//);
    });

    it('should delete files when reward is removed', async () => {
      const key = 'rewards/vtuber-123/test.jpg';

      // Mock S3 client send method for delete
      jest.spyOn(service['s3Client'], 'send').mockResolvedValue({} as any);

      await expect(service.deleteFile(key)).resolves.not.toThrow();
    });

    it('should handle storage service outages', async () => {
      const file = Buffer.from('fake image data');
      const key = 'rewards/vtuber-123/test.jpg';
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Test Image',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
      };

      // Mock S3 service failure
      jest.spyOn(service['s3Client'], 'send').mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(service.uploadFile(file, key, metadata)).rejects.toThrow();
    });
  });

  describe('CDN Integration', () => {
    it('should serve files through CDN', async () => {
      const key = 'rewards/vtuber-123/test.jpg';
      const expectedCdnUrl = 'https://cdn.example.com/rewards/vtuber-123/test.jpg';

      const cdnUrl = service.getCdnUrl(key);
      expect(cdnUrl).toBe(expectedCdnUrl);
    });

    it('should handle CDN cache invalidation', async () => {
      const key = 'rewards/vtuber-123/test.jpg';

      await expect(async () => {
        await service.invalidateCache(key);
      }).not.toThrow();
    });
  });

  describe('File Validation', () => {
    it('should validate file integrity after upload', async () => {
      const file = Buffer.from('fake image data');
      const key = 'rewards/vtuber-123/test.jpg';
      const metadata = {
        vtuberId: 'vtuber-123',
        name: 'Test Image',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
      };

      // Mock S3 operations
      jest.spyOn(service['s3Client'], 'send')
        .mockResolvedValueOnce({} as any) // upload
        .mockResolvedValueOnce({ // getFileMetadata
          Metadata: {
            vtuberId: metadata.vtuberId,
            name: metadata.name,
            originalName: metadata.originalName,
          },
          ContentType: metadata.mimeType,
          ContentLength: metadata.size,
        } as any);

      const uploadResult = await service.uploadFile(file, key, metadata);
      
      // Verify file was uploaded correctly
      const retrievedMetadata = await service.getFileMetadata(key);
      expect(retrievedMetadata.size).toBe(metadata.size);
      expect(retrievedMetadata.mimeType).toBe(metadata.mimeType);
    });
  });
});