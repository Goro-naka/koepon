import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;
  let passwordService: PasswordService;
  let databaseService: DatabaseService;
  let jwtService: JwtService;
  let loggerService: CustomLoggerService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    role: 'FAN',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(async () => {
    const mockPasswordService = {
      validatePassword: jest.fn(),
      hashPassword: jest.fn(),
    };

    const mockDatabaseService = {
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      createSession: jest.fn(),
      removeSession: jest.fn(),
      getSessionByRefreshToken: jest.fn(),
      updateSessionExpiry: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
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
        AuthService,
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    passwordService = module.get<PasswordService>(PasswordService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    jwtService = module.get<JwtService>(JwtService);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      // Given: 有効なメール・パスワード
      const email = 'test@example.com';
      const password = 'validPassword';
      
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(true);

      // When: validateUser を実行
      const result = await authService.validateUser(email, password);

      // Then: ユーザー情報を返す
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(databaseService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.validatePassword).toHaveBeenCalledWith(password, mockUser.password_hash);
    });

    it('should return null when email not found', async () => {
      // Given: 存在しないメール
      const email = 'nonexistent@example.com';
      const password = 'password';
      
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);

      // When: validateUser を実行
      const result = await authService.validateUser(email, password);

      // Then: null を返す
      expect(result).toBeNull();
      expect(databaseService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.validatePassword).not.toHaveBeenCalled();
    });

    it('should return null when password is incorrect', async () => {
      // Given: 正しいメール、間違ったパスワード
      const email = 'test@example.com';
      const password = 'wrongPassword';
      
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(false);

      // When: validateUser を実行
      const result = await authService.validateUser(email, password);

      // Then: null を返す
      expect(result).toBeNull();
      expect(databaseService.getUserByEmail).toHaveBeenCalledWith(email);
      expect(passwordService.validatePassword).toHaveBeenCalledWith(password, mockUser.password_hash);
    });

    it('should handle database errors gracefully', async () => {
      // Given: データベースエラーが発生
      const email = 'test@example.com';
      const password = 'password';
      const dbError = new Error('Database connection failed');
      
      jest.spyOn(databaseService, 'getUserByEmail').mockRejectedValue(dbError);

      // When: validateUser を実行
      // Then: 適切な例外を投げる
      await expect(authService.validateUser(email, password)).rejects.toThrow(dbError);
      expect(loggerService.error).toHaveBeenCalledWith(
        'Database error during user validation',
        expect.any(String),
        'AuthService'
      );
    });
  });

  describe('login', () => {
    const mockValidUser = {
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    };

    it('should return access and refresh tokens for valid credentials', async () => {
      // Given: 有効な認証情報
      const email = 'test@example.com';
      const password = 'validPassword';
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };
      
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockValidUser);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(mockTokens.accessToken);
      jest.spyOn(databaseService, 'createSession').mockResolvedValue({
        id: 'session_id',
        refreshToken: mockTokens.refreshToken,
      });

      // When: login を実行
      const result = await authService.login(email, password);

      // Then: { accessToken, refreshToken, user } を返す
      expect(result).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        user: mockValidUser,
      });
    });

    it('should create session record in database', async () => {
      // Given: 有効な認証情報
      const email = 'test@example.com';
      const password = 'validPassword';
      
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockValidUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      jest.spyOn(databaseService, 'createSession').mockResolvedValue({
        id: 'session_id',
        refreshToken: 'refresh_token',
      });

      // When: login を実行
      await authService.login(email, password);

      // Then: sessions テーブルにレコードが作成される
      expect(databaseService.createSession).toHaveBeenCalledWith(
        mockValidUser.id,
        expect.any(String) // refresh token
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Given: 無効な認証情報
      const email = 'test@example.com';
      const password = 'wrongPassword';
      
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      // When: login を実行
      // Then: UnauthorizedException を投げる
      await expect(authService.login(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should log security event on failed login', async () => {
      // Given: 無効な認証情報
      const email = 'test@example.com';
      const password = 'wrongPassword';
      
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      // When: login を実行
      try {
        await authService.login(email, password);
      } catch (error) {
        // Then: セキュリティログが記録される
        expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
          'FAILED_LOGIN_ATTEMPT',
          { email },
          'Failed login attempt'
        );
      }
    });
  });

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token', async () => {
      // Given: 有効なリフレッシュトークン
      const refreshToken = 'valid_refresh_token';
      const mockSession = {
        id: 'session_id',
        userId: mockUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      };
      const newAccessToken = 'new_access_token';
      
      jest.spyOn(databaseService, 'getSessionByRefreshToken').mockResolvedValue(mockSession);
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue(newAccessToken);
      jest.spyOn(databaseService, 'updateSessionExpiry').mockResolvedValue(undefined);

      // When: refreshToken を実行
      const result = await authService.refreshToken(refreshToken);

      // Then: 新しいアクセストークンを返す
      expect(result).toEqual({
        accessToken: newAccessToken,
      });
      expect(databaseService.updateSessionExpiry).toHaveBeenCalledWith(mockSession.id);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Given: 無効なリフレッシュトークン
      const refreshToken = 'invalid_refresh_token';
      
      jest.spyOn(databaseService, 'getSessionByRefreshToken').mockResolvedValue(null);

      // When: refreshToken を実行
      // Then: UnauthorizedException を投げる
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      // Given: 期限切れのリフレッシュトークン
      const refreshToken = 'expired_refresh_token';
      const expiredSession = {
        id: 'session_id',
        userId: mockUser.id,
        refreshToken,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24時間前
      };
      
      jest.spyOn(databaseService, 'getSessionByRefreshToken').mockResolvedValue(expiredSession);

      // When: refreshToken を実行
      // Then: UnauthorizedException を投げる
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should remove session from database', async () => {
      // Given: 有効なセッション
      const sessionId = 'valid_session_id';
      
      jest.spyOn(databaseService, 'removeSession').mockResolvedValue(undefined);

      // When: logout を実行
      await authService.logout(sessionId);

      // Then: sessions テーブルからレコードが削除される
      expect(databaseService.removeSession).toHaveBeenCalledWith(sessionId);
    });

    it('should handle non-existent session gracefully', async () => {
      // Given: 存在しないセッション
      const sessionId = 'non_existent_session_id';
      
      jest.spyOn(databaseService, 'removeSession').mockResolvedValue(undefined);

      // When: logout を実行
      // Then: エラーを投げずに完了する
      await expect(authService.logout(sessionId)).resolves.toBeUndefined();
      expect(databaseService.removeSession).toHaveBeenCalledWith(sessionId);
    });
  });
});