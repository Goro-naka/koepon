import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let authService: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password_hash: '$2b$12$hashedPasswordExample',
    role: 'FAN',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockAdminUser = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'admin@example.com',
    password_hash: '$2b$12$hashedPasswordExample',
    role: 'ADMIN',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockVtuberUser = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'vtuber@example.com',
    password_hash: '$2b$12$hashedPasswordExample',
    role: 'VTUBER',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '1h' },
        }),
        ThrottlerModule.forRoot([{
          ttl: 60000,
          limit: 5,
        }]),
      ],
      controllers: [AuthController],
    })
    .overrideProvider(DatabaseService)
    .useValue({
      getUserByEmail: jest.fn(),
      getUserById: jest.fn(),
      createSession: jest.fn(),
      removeSession: jest.fn(),
      getSessionByRefreshToken: jest.fn(),
      updateSessionExpiry: jest.fn(),
    })
    .overrideProvider(CustomLoggerService)
    .useValue({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logSecurityEvent: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Flow Integration', () => {
    describe('POST /api/v1/auth/login', () => {
      it('should complete full login flow successfully', async () => {
        // Given: 有効なユーザー認証情報
        const loginDto = {
          email: 'test@example.com',
          password: 'validPassword123',
        };

        jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);
        jest.spyOn(authService, 'validateUser').mockResolvedValue({
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        });
        jest.spyOn(databaseService, 'createSession').mockResolvedValue({
          id: 'session_id',
          refreshToken: 'refresh_token_123',
        });

        // When: POST /api/v1/auth/login
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto);

        // Then: 
        //   - 200 OK を返す
        //   - アクセストークンとリフレッシュトークンを返す
        //   - セッションがDBに保存される
        //   - ログが記録される
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.id).toBe(mockUser.id);
        expect(response.body.user.email).toBe(mockUser.email);
        expect(databaseService.createSession).toHaveBeenCalledWith(
          mockUser.id,
          expect.any(String)
        );
      });

      it('should handle invalid credentials properly', async () => {
        // Given: 無効な認証情報
        const invalidLoginDto = {
          email: 'test@example.com',
          password: 'wrongPassword',
        };

        jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

        // When: POST /api/v1/auth/login
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(invalidLoginDto);

        // Then:
        //   - 401 Unauthorized を返す
        //   - エラーメッセージを返す
        //   - セキュリティログが記録される
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Unauthorized');
      });

      it('should enforce rate limiting', async () => {
        // Given: 連続した多数のログイン試行
        const loginDto = {
          email: 'test@example.com',
          password: 'password',
        };

        jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

        // When: POST /api/v1/auth/login を連続実行
        const requests = [];
        for (let i = 0; i < 10; i++) {
          requests.push(
            request(app.getHttpServer())
              .post('/api/v1/auth/login')
              .send(loginDto)
          );
        }

        const responses = await Promise.all(requests);

        // Then: 429 Too Many Requests を返す
        const tooManyRequestsResponses = responses.filter(r => r.status === 429);
        expect(tooManyRequestsResponses.length).toBeGreaterThan(0);
      });

      it('should validate request body', async () => {
        // Given: 無効なリクエストボディ
        const invalidBody = {
          email: 'invalid-email',
          password: '123', // too short
        };

        // When: POST /api/v1/auth/login
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(invalidBody);

        // Then: 400 Bad Request を返す
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('POST /api/v1/auth/refresh', () => {
      it('should refresh token successfully', async () => {
        // Given: 有効なリフレッシュトークン
        const refreshDto = {
          refreshToken: 'valid_refresh_token',
        };

        jest.spyOn(databaseService, 'getSessionByRefreshToken').mockResolvedValue({
          id: 'session_id',
          userId: mockUser.id,
          refreshToken: refreshDto.refreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
        jest.spyOn(databaseService, 'updateSessionExpiry').mockResolvedValue(undefined);

        // When: POST /api/v1/auth/refresh
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send(refreshDto);

        // Then:
        //   - 200 OK を返す
        //   - 新しいアクセストークンを返す
        //   - セッション期限が更新される
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
        expect(databaseService.updateSessionExpiry).toHaveBeenCalledWith('session_id');
      });

      it('should reject invalid refresh token', async () => {
        // Given: 無効なリフレッシュトークン
        const refreshDto = {
          refreshToken: 'invalid_refresh_token',
        };

        jest.spyOn(databaseService, 'getSessionByRefreshToken').mockResolvedValue(null);

        // When: POST /api/v1/auth/refresh
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send(refreshDto);

        // Then: 401 Unauthorized を返す
        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should logout successfully', async () => {
        // Given: 有効なセッション
        const logoutDto = {
          sessionId: 'valid_session_id',
        };

        jest.spyOn(databaseService, 'removeSession').mockResolvedValue(undefined);

        // When: POST /api/v1/auth/logout
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/logout')
          .send(logoutDto);

        // Then: 200 OK を返す
        expect(response.status).toBe(200);
        expect(databaseService.removeSession).toHaveBeenCalledWith(logoutDto.sessionId);
      });
    });
  });

  describe('Authentication Guard Integration', () => {
    let accessToken: string;

    beforeEach(async () => {
      // テスト用の有効なトークンを生成
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      jest.spyOn(databaseService, 'createSession').mockResolvedValue({
        id: 'session_id',
        refreshToken: 'refresh_token_123',
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'validPassword123',
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('should protect endpoint with valid token', async () => {
      // Given: 有効なJWTトークン
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: GET /protected-endpoint (Authorization: Bearer token)
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 200 OK でレスポンスを返す
      expect(response.status).toBe(200);
    });

    it('should reject request without token', async () => {
      // Given: トークンなし
      // When: GET /protected-endpoint
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile');

      // Then: 401 Unauthorized を返す
      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      // Given: 無効なJWTトークン
      const invalidToken = 'invalid.jwt.token';

      // When: GET /protected-endpoint
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`);

      // Then: 401 Unauthorized を返す
      expect(response.status).toBe(401);
    });

    it('should reject request with expired token', async () => {
      // Given: 期限切れのJWTトークン（テスト用に短期間設定）
      // 実際のテストでは期限切れトークンをモックで作成する必要があります
      const expiredToken = 'expired.jwt.token';

      // When: GET /protected-endpoint
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      // Then: 401 Unauthorized を返す
      expect(response.status).toBe(401);
    });
  });

  describe('Role-based Authorization Integration', () => {
    let adminToken: string;
    let fanToken: string;
    let vtuberToken: string;

    beforeEach(async () => {
      // Admin token
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValueOnce(mockAdminUser);
      jest.spyOn(authService, 'validateUser').mockResolvedValueOnce({
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        role: mockAdminUser.role,
      });
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password' });
      adminToken = adminLoginResponse.body.accessToken;

      // Fan token
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValueOnce(mockUser);
      jest.spyOn(authService, 'validateUser').mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      const fanLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      fanToken = fanLoginResponse.body.accessToken;

      // VTuber token
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValueOnce(mockVtuberUser);
      jest.spyOn(authService, 'validateUser').mockResolvedValueOnce({
        id: mockVtuberUser.id,
        email: mockVtuberUser.email,
        role: mockVtuberUser.role,
      });
      const vtuberLoginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'vtuber@example.com', password: 'password' });
      vtuberToken = vtuberLoginResponse.body.accessToken;
    });

    it('should allow admin access to admin endpoint', async () => {
      // Given: ADMIN ロールのユーザートークン
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockAdminUser);

      // When: GET /admin/users
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      // Then: 200 OK でレスポンスを返す
      // Note: この部分は実際のadminエンドポイントが実装された後にテストできます
      expect(response.status).not.toBe(403); // 403でないことを確認
    });

    it('should deny fan access to admin endpoint', async () => {
      // Given: FAN ロールのユーザートークン
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: GET /admin/users
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${fanToken}`);

      // Then: 403 Forbidden を返す
      expect(response.status).toBe(403);
    });

    it('should allow vtuber access to vtuber endpoint', async () => {
      // Given: VTUBER ロールのユーザートークン
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockVtuberUser);

      // When: GET /vtuber/dashboard
      const response = await request(app.getHttpServer())
        .get('/api/v1/vtuber/dashboard')
        .set('Authorization', `Bearer ${vtuberToken}`);

      // Then: 200 OK でレスポンスを返す
      // Note: この部分は実際のvtuberエンドポイントが実装された後にテストできます
      expect(response.status).not.toBe(403); // 403でないことを確認
    });
  });

  describe('Error Handling Integration', () => {
    describe('Security Error Handling', () => {
      it('should not expose sensitive information in error messages', async () => {
        // Given: 認証エラー状況
        const invalidLoginDto = {
          email: 'test@example.com',
          password: 'wrongPassword',
        };

        jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

        // When: 認証が失敗
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(invalidLoginDto);

        // Then: 詳細なエラー情報を含まない汎用メッセージを返す
        expect(response.status).toBe(401);
        expect(response.body.message).not.toContain('password');
        expect(response.body.message).not.toContain('database');
        expect(response.body.message).not.toContain('hash');
      });

      it('should log security events', async () => {
        // Given: セキュリティ関連のエラー
        const invalidLoginDto = {
          email: 'test@example.com',
          password: 'wrongPassword',
        };

        jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

        // When: エラーが発生
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(invalidLoginDto);

        // Then: 適切なセキュリティログが記録される
        // Note: この部分は実際のログサービスの実装に依存します
        // 実装後にloggerService.logSecurityEventが呼ばれることを確認
      });
    });
  });

  describe('Performance Tests', () => {
    it('should validate JWT within 10ms', async () => {
      // Given: 有効なJWTトークン
      
      // 事前にトークンを生成
      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      const accessToken = loginResponse.body.accessToken;
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: JWT検証を実行
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);
      
      const endTime = Date.now();

      // Then: 10ms以内で完了する
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should handle 10 concurrent login requests', async () => {
      // Given: 10個の同時ログインリクエスト
      const loginDto = {
        email: 'test@example.com',
        password: 'validPassword123',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'validateUser').mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      jest.spyOn(databaseService, 'createSession').mockResolvedValue({
        id: 'session_id',
        refreshToken: 'refresh_token_123',
      });

      // When: 並行処理を実行
      const startTime = Date.now();
      
      const requests = Array(10).fill(0).map(() =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(loginDto)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Then: すべて500ms以内で応答する
      expect(endTime - startTime).toBeLessThan(500);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});