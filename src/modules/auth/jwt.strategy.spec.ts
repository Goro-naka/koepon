import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let databaseService: DatabaseService;
  let loggerService: CustomLoggerService;

  const mockJwtPayload = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'FAN',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後
  };

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    role: 'FAN',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeEach(async () => {
    const mockDatabaseService = {
      getUserById: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logSecurityEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    databaseService = module.get<DatabaseService>(DatabaseService);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('validate', () => {
    it('should validate valid JWT payload', async () => {
      // Given: 有効なJWTペイロード
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: validate を実行
      const result = await jwtStrategy.validate(mockJwtPayload);

      // Then: ユーザー情報を返す
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(databaseService.getUserById).toHaveBeenCalledWith(mockJwtPayload.sub);
    });

    it('should reject payload with invalid user ID', async () => {
      // Given: 無効なユーザーIDのペイロード
      const invalidPayload = {
        ...mockJwtPayload,
        sub: 'non-existent-user-id',
      };
      
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(null);

      // When: validate を実行
      // Then: UnauthorizedException を投げる
      await expect(jwtStrategy.validate(invalidPayload)).rejects.toThrow(UnauthorizedException);
      expect(databaseService.getUserById).toHaveBeenCalledWith(invalidPayload.sub);
      expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
        'INVALID_JWT_USER',
        { userId: invalidPayload.sub },
        'JWT validation failed: user not found'
      );
    });

    it('should reject payload from deleted user', async () => {
      // Given: 削除済みユーザーのペイロード
      const deletedUser = {
        ...mockUser,
        deleted_at: new Date(),
      };
      
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(deletedUser);

      // When: validate を実行
      // Then: UnauthorizedException を投げる
      await expect(jwtStrategy.validate(mockJwtPayload)).rejects.toThrow(UnauthorizedException);
      expect(databaseService.getUserById).toHaveBeenCalledWith(mockJwtPayload.sub);
      expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
        'DELETED_USER_ACCESS_ATTEMPT',
        { userId: mockJwtPayload.sub },
        'JWT validation failed: user is deleted'
      );
    });

    it('should handle database errors gracefully', async () => {
      // Given: データベースエラーが発生
      const dbError = new Error('Database connection failed');
      
      jest.spyOn(databaseService, 'getUserById').mockRejectedValue(dbError);

      // When: validate を実行
      // Then: エラーを再投げする
      await expect(jwtStrategy.validate(mockJwtPayload)).rejects.toThrow(dbError);
      expect(databaseService.getUserById).toHaveBeenCalledWith(mockJwtPayload.sub);
      expect(loggerService.error).toHaveBeenCalledWith(
        'Database error during JWT validation',
        expect.any(String),
        'JwtStrategy'
      );
    });

    it('should handle malformed payload gracefully', async () => {
      // Given: 不正な形式のペイロード
      const malformedPayload = {
        sub: null,
        email: '',
        role: '',
        iat: 0,
        exp: 0,
      };

      // When: validate を実行
      // Then: UnauthorizedException を投げる
      await expect(jwtStrategy.validate(malformedPayload as any)).rejects.toThrow(
        UnauthorizedException
      );
      expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
        'MALFORMED_JWT_PAYLOAD',
        { payload: malformedPayload },
        'JWT validation failed: malformed payload'
      );
    });

    it('should validate payload with different roles', async () => {
      // Given: 異なるロールのユーザー
      const vtuberUser = { ...mockUser, role: 'VTUBER' };
      const adminUser = { ...mockUser, role: 'ADMIN' };
      
      const vtuberPayload = { ...mockJwtPayload, role: 'VTUBER' };
      const adminPayload = { ...mockJwtPayload, role: 'ADMIN' };

      jest.spyOn(databaseService, 'getUserById')
        .mockResolvedValueOnce(vtuberUser)
        .mockResolvedValueOnce(adminUser);

      // When: 異なるロールで validate を実行
      const vtuberResult = await jwtStrategy.validate(vtuberPayload);
      const adminResult = await jwtStrategy.validate(adminPayload);

      // Then: それぞれのロールで正しく認証される
      expect(vtuberResult.role).toBe('VTUBER');
      expect(adminResult.role).toBe('ADMIN');
    });
  });
});