import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { UserModule } from './user.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

describe('User Management Integration Tests', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let userService: UserService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    password_hash: '$2b$12$hashedPasswordExample',
    role: 'FAN',
    profile_image_url: null,
    birth_date: new Date('1990-01-01'),
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '1h' },
        }),
        ThrottlerModule.forRoot([{
          ttl: 60000,
          limit: 10,
        }]),
      ],
      controllers: [UserController],
    })
    .overrideProvider(DatabaseService)
    .useValue({
      getUserByEmail: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      removeAllUserSessions: jest.fn(),
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      searchUsers: jest.fn(),
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
    userService = moduleFixture.get<UserService>(UserService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration Flow Integration', () => {
    describe('POST /api/v1/users/register', () => {
      it('should complete full registration flow', async () => {
        // Given: 有効な登録データ
        const registerDto = {
          email: 'newuser@example.com',
          password: 'password123',
          username: 'newuser',
          displayName: 'New User',
          birthDate: '1990-01-01',
        };

        jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
        jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);
        jest.spyOn(databaseService, 'createUser').mockResolvedValue({
          ...mockUser,
          ...registerDto,
          display_name: registerDto.displayName,
        });

        // When: POST /api/v1/users/register
        const response = await request(app.getHttpServer())
          .post('/api/v1/users/register')
          .send(registerDto);

        // Then: 
        //   - 201 Created を返す
        //   - ユーザーがDBに作成される
        //   - セッションが作成される
        //   - アクセストークンとリフレッシュトークンが返される
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(databaseService.createUser).toHaveBeenCalled();
      });

      it('should prevent duplicate email registration', async () => {
        // Given: 既に登録されたメールアドレス
        const registerDto = {
          email: 'existing@example.com',
          password: 'password123',
          username: 'newuser',
          displayName: 'New User',
        };

        jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);

        // When: POST /api/v1/users/register
        const response = await request(app.getHttpServer())
          .post('/api/v1/users/register')
          .send(registerDto);

        // Then:
        //   - 409 Conflict を返す
        //   - 適切なエラーメッセージを返す
        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Email already exists');
      });

      it('should prevent duplicate username registration', async () => {
        // Given: 既に登録されたユーザー名
        const registerDto = {
          email: 'newuser@example.com',
          password: 'password123',
          username: 'existinguser',
          displayName: 'New User',
        };

        jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
        jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(mockUser);

        // When: POST /api/v1/users/register
        const response = await request(app.getHttpServer())
          .post('/api/v1/users/register')
          .send(registerDto);

        // Then:
        //   - 409 Conflict を返す
        //   - 適切なエラーメッセージを返す
        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Username already exists');
      });

      it('should validate request body', async () => {
        // Given: 無効なリクエストボディ
        const invalidBody = {
          email: 'invalid-email',
          password: '123', // too short
          username: 'ab', // too short
          displayName: '', // empty
        };

        // When: POST /api/v1/users/register
        const response = await request(app.getHttpServer())
          .post('/api/v1/users/register')
          .send(invalidBody);

        // Then: 422 Unprocessable Entity を返す
        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should enforce rate limiting', async () => {
        // Given: 連続した多数の登録試行
        const registerDto = {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
          displayName: 'Test User',
        };

        jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
        jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);

        // When: POST /api/v1/users/register を連続実行
        const requests = [];
        for (let i = 0; i < 15; i++) {
          requests.push(
            request(app.getHttpServer())
              .post('/api/v1/users/register')
              .send({ ...registerDto, email: `test${i}@example.com`, username: `test${i}` })
          );
        }

        const responses = await Promise.all(requests);

        // Then: 429 Too Many Requests を返す
        const tooManyRequestsResponses = responses.filter(r => r.status === 429);
        expect(tooManyRequestsResponses.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Profile Management Integration', () => {
    let accessToken: string;

    beforeEach(async () => {
      // テスト用の有効なトークンを生成
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // 実際のJWTトークン生成をモック
      accessToken = 'valid_jwt_token';
    });

    it('should get user profile with authentication', async () => {
      // Given: 有効な認証トークン
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: GET /api/v1/users/profile
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 200 OK でユーザー情報を返す
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should reject unauthenticated profile access', async () => {
      // Given: 認証トークンなし
      // When: GET /api/v1/users/profile
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/profile');

      // Then: 401 Unauthorized を返す
      expect(response.status).toBe(401);
    });

    it('should update profile successfully', async () => {
      // Given: 有効な認証トークンと更新データ
      const updateDto = {
        username: 'updateduser',
        displayName: 'Updated User',
      };

      const updatedUser = { ...mockUser, ...updateDto, display_name: updateDto.displayName };
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(updatedUser);

      // When: PUT /api/v1/users/profile
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      // Then:
      //   - 200 OK を返す
      //   - データベースが更新される
      //   - 更新された情報を返す
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe(updateDto.username);
      expect(response.body.data.display_name).toBe(updateDto.displayName);
      expect(databaseService.updateUser).toHaveBeenCalled();
    });

    it('should get other user public profile', async () => {
      // Given: 他のユーザーのID
      const otherUserId = 'other-user-id';
      const otherUser = { ...mockUser, id: otherUserId };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(otherUser);

      // When: GET /api/v1/users/:userId
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 200 OK で公開情報のみを返す
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).toHaveProperty('display_name');
      expect(response.body.data).not.toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('birth_date');
    });
  });

  describe('Password Management Integration', () => {
    let accessToken: string;

    beforeEach(() => {
      accessToken = 'valid_jwt_token';
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
    });

    it('should change password successfully', async () => {
      // Given: 有効な現在パスワードと新パスワード
      const changePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword123',
      };

      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'removeAllUserSessions').mockResolvedValue(undefined);

      // When: PUT /api/v1/users/password
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordDto);

      // Then:
      //   - 200 OK を返す
      //   - パスワードハッシュが更新される
      //   - 全セッションが無効化される
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
      expect(databaseService.updateUser).toHaveBeenCalled();
      expect(databaseService.removeAllUserSessions).toHaveBeenCalled();
    });

    it('should reject invalid request body', async () => {
      // Given: 無効なリクエストボディ
      const invalidDto = {
        currentPassword: '', // empty
        newPassword: '123', // too short
      };

      // When: PUT /api/v1/users/password
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto);

      // Then: 422 Unprocessable Entity を返す
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('User Search Integration', () => {
    let accessToken: string;

    beforeEach(() => {
      accessToken = 'valid_jwt_token';
    });

    it('should search users successfully', async () => {
      // Given: 検索クエリ
      const query = 'test';
      const searchResult = {
        users: [
          {
            id: mockUser.id,
            username: mockUser.username,
            display_name: mockUser.display_name,
            profile_image_url: mockUser.profile_image_url,
          },
        ],
        total: 1,
      };

      jest.spyOn(databaseService, 'searchUsers').mockResolvedValue(searchResult);

      // When: GET /api/v1/users/search?q=test
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/search')
        .query({ q: query })
        .set('Authorization', `Bearer ${accessToken}`);

      // Then:
      //   - 200 OK を返す
      //   - マッチするユーザー情報を返す
      //   - ページネーション情報を返す
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.limit).toBeDefined();
      expect(response.body.data.offset).toBeDefined();
    });

    it('should respect search limits', async () => {
      // Given: limit パラメータ
      const query = 'test';
      const limit = 5;

      jest.spyOn(databaseService, 'searchUsers').mockResolvedValue({ users: [], total: 0 });

      // When: GET /api/v1/users/search?q=test&limit=5
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/search')
        .query({ q: query, limit })
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 指定した件数以下でユーザーを返す
      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(limit);
      expect(databaseService.searchUsers).toHaveBeenCalledWith(query, limit, 0);
    });

    it('should handle empty search results', async () => {
      // Given: マッチしない検索クエリ
      const query = 'nonexistent';

      jest.spyOn(databaseService, 'searchUsers').mockResolvedValue({ users: [], total: 0 });

      // When: GET /api/v1/users/search?q=nonexistent
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/search')
        .query({ q: query })
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 200 OK で空の結果を返す
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should reject empty search query', async () => {
      // Given: 空の検索クエリ
      const query = '';

      // When: GET /api/v1/users/search?q=
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/search')
        .query({ q: query })
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 400 Bad Request を返す
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid limit', async () => {
      // Given: 無効なlimit値
      const query = 'test';
      const limit = 200; // 最大100を超える

      // When: GET /api/v1/users/search?q=test&limit=200
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/search')
        .query({ q: query, limit })
        .set('Authorization', `Bearer ${accessToken}`);

      // Then: 400 Bad Request を返す
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});