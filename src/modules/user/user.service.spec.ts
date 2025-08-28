import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService, createMockDatabaseService, createMockPasswordService } from '../../test/test-helpers';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from '../auth/password.service';
import { DatabaseService } from '../database/database.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('UserService', () => {
  let userService: UserService;
  let authService: AuthService;
  let passwordService: PasswordService;
  let databaseService: DatabaseService;
  let loggerService: CustomLoggerService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    password_hash: '$2b$12$hashedPassword',
    role: 'FAN',
    profile_image_url: null,
    birth_date: new Date('1990-01-01'),
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(),
          })),
          range: jest.fn(() => ({
            order: jest.fn(() => ({
              then: jest.fn(),
            })),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(),
            })),
          })),
        })),
        or: jest.fn(() => ({
          range: jest.fn(() => ({
            order: jest.fn(),
          })),
        })),
      })),
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(),
          remove: jest.fn(),
          getPublicUrl: jest.fn(),
        })),
      },
    };

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const mockPasswordService = createMockPasswordService();
    const mockDatabaseService = createMockDatabaseService();
    const mockLoggerService = createMockCustomLoggerService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    passwordService = module.get<PasswordService>(PasswordService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('registerUser', () => {
    it('should create new user with valid data', async () => {
      // Given: 有効なユーザー登録データ
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        displayName: 'New User',
        birthDate: '1990-01-01',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashedPassword');
      
      const mockSupabaseResponse = {
        data: {
          id: mockUser.id,
          email: registerDto.email,
          username: registerDto.username,
          display_name: registerDto.displayName,
          birth_date: registerDto.birthDate,
          avatar_url: null,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockSupabaseResponse),
          }),
        }),
      });

      // When: registerUser を実行
      const result = await userService.registerUser(registerDto);

      // Then: ユーザーが作成される
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', registerDto.email);
      expect(result).toHaveProperty('username', registerDto.username);
      expect(result).toHaveProperty('displayName', registerDto.displayName);
      expect(result).toHaveProperty('role', 'user');
      expect(passwordService.hashPassword).toHaveBeenCalledWith(registerDto.password);
    });

    it('should throw ConflictException for duplicate email', async () => {
      // Given: 既に存在するメールアドレス
      const registerDto: RegisterUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'newuser',
        displayName: 'New User',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(mockUser);

      // When: registerUser を実行
      // Then: ConflictException を投げる
      await expect(userService.registerUser(registerDto)).rejects.toThrow(ConflictException);
      expect(databaseService.getUserByEmail).toHaveBeenCalledWith(registerDto.email);
    });

    it('should throw ConflictException for duplicate username', async () => {
      // Given: 既に存在するユーザー名
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'existinguser',
        displayName: 'New User',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(mockUser);

      // When: registerUser を実行
      // Then: ConflictException を投げる
      await expect(userService.registerUser(registerDto)).rejects.toThrow(ConflictException);
      expect(databaseService.getUserByUsername).toHaveBeenCalledWith(registerDto.username);
    });

    it('should hash password before saving', async () => {
      // Given: 平文パスワード
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'plainPassword',
        username: 'newuser',
        displayName: 'New User',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashedPassword');
      jest.spyOn(databaseService, 'createUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      });

      // When: registerUser を実行
      await userService.registerUser(registerDto);

      // Then: パスワードがハッシュ化されて保存される
      expect(passwordService.hashPassword).toHaveBeenCalledWith('plainPassword');
      expect(databaseService.createUser).toHaveBeenCalledWith(expect.objectContaining({
        password_hash: 'hashedPassword',
      }));
    });

    it('should set default role as FAN', async () => {
      // Given: ロール指定なしの登録データ
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        displayName: 'New User',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashedPassword');
      jest.spyOn(databaseService, 'createUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: mockUser.id, email: mockUser.email, role: 'FAN' },
      });

      // When: registerUser を実行
      await userService.registerUser(registerDto);

      // Then: ロールが 'FAN' に設定される
      expect(databaseService.createUser).toHaveBeenCalledWith(expect.objectContaining({
        role: 'FAN',
      }));
    });

    it('should create session after registration', async () => {
      // Given: 有効な登録データ
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        displayName: 'New User',
      };

      jest.spyOn(databaseService, 'getUserByEmail').mockResolvedValue(null);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashedPassword');
      jest.spyOn(databaseService, 'createUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'token',
        refreshToken: 'refresh',
        user: { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      });

      // When: registerUser を実行
      await userService.registerUser(registerDto);

      // Then: セッションが作成される
      expect(authService.login).toHaveBeenCalledWith(registerDto.email, registerDto.password);
    });
  });

  describe('getUserById', () => {
    it('should return user data for valid ID', async () => {
      // Given: 存在するユーザーID
      const userId = mockUser.id;
      const requestingUserId = mockUser.id;

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: getUserById を実行
      const result = await userService.getUserById(userId, requestingUserId);

      // Then: ユーザー情報を返す
      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(databaseService.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return null for non-existent ID', async () => {
      // Given: 存在しないユーザーID
      const userId = 'non-existent-id';
      const requestingUserId = mockUser.id;

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(null);

      // When: getUserById を実行
      const result = await userService.getUserById(userId, requestingUserId);

      // Then: null を返す
      expect(result).toBeNull();
      expect(databaseService.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should not return password hash in response', async () => {
      // Given: 有効なユーザーID
      const userId = mockUser.id;
      const requestingUserId = mockUser.id;

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: getUserById を実行
      const result = await userService.getUserById(userId, requestingUserId);

      // Then: レスポンスにパスワードハッシュが含まれない
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return public fields only for other users', async () => {
      // Given: 他のユーザーのID、リクエストユーザー情報
      const userId = mockUser.id;
      const requestingUserId = 'other-user-id';

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: getUserById を実行
      const result = await userService.getUserById(userId, requestingUserId);

      // Then: 公開情報のみを返す
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('display_name');
      expect(result).toHaveProperty('profile_image_url');
      expect(result).toHaveProperty('created_at');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('birth_date');
    });

    it('should return all fields for own profile', async () => {
      // Given: 自分のユーザーID
      const userId = mockUser.id;
      const requestingUserId = mockUser.id;

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);

      // When: getUserById を実行
      const result = await userService.getUserById(userId, requestingUserId);

      // Then: 全ての情報を返す
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('display_name');
      expect(result).toHaveProperty('birth_date');
      expect(result).toHaveProperty('created_at');
    });
  });

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      // Given: 有効な更新データ
      const userId = mockUser.id;
      const updateDto: UpdateUserDto = {
        username: 'updateduser',
        displayName: 'Updated User',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(null);
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(updatedUser);

      // When: updateUser を実行
      const result = await userService.updateUser(userId, updateDto);

      // Then: ユーザー情報が更新される
      expect(result).toBeDefined();
      expect(result.username).toBe(updateDto.username);
      expect(result.display_name).toBe(updateDto.displayName);
      expect(databaseService.updateUser).toHaveBeenCalledWith(userId, expect.objectContaining({
        username: updateDto.username,
        display_name: updateDto.displayName,
      }));
    });

    it('should throw ConflictException for duplicate username', async () => {
      // Given: 既存のユーザー名に変更しようとするデータ
      const userId = mockUser.id;
      const updateDto: UpdateUserDto = {
        username: 'existinguser',
      };

      const existingUser = { ...mockUser, id: 'another-id', username: 'existinguser' };
      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'getUserByUsername').mockResolvedValue(existingUser);

      // When: updateUser を実行
      // Then: ConflictException を投げる
      await expect(userService.updateUser(userId, updateDto)).rejects.toThrow(ConflictException);
    });

    it('should update only provided fields', async () => {
      // Given: 一部のフィールドのみの更新データ
      const userId = mockUser.id;
      const updateDto: UpdateUserDto = {
        displayName: 'Only Display Name Updated',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue({ ...mockUser, display_name: updateDto.displayName });

      // When: updateUser を実行
      await userService.updateUser(userId, updateDto);

      // Then: 指定フィールドのみ更新される
      expect(databaseService.updateUser).toHaveBeenCalledWith(userId, expect.objectContaining({
        display_name: updateDto.displayName,
      }));
      expect(databaseService.updateUser).not.toHaveBeenCalledWith(userId, expect.objectContaining({
        username: expect.any(String),
      }));
    });

    it('should throw NotFoundException for non-existent user', async () => {
      // Given: 存在しないユーザーID
      const userId = 'non-existent-id';
      const updateDto: UpdateUserDto = {
        displayName: 'Updated Name',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(null);

      // When: updateUser を実行
      // Then: NotFoundException を投げる
      await expect(userService.updateUser(userId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should update timestamps', async () => {
      // Given: 更新データ
      const userId = mockUser.id;
      const updateDto: UpdateUserDto = {
        displayName: 'Updated User',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(mockUser);

      // When: updateUser を実行
      await userService.updateUser(userId, updateDto);

      // Then: updated_at が現在時刻に更新される
      expect(databaseService.updateUser).toHaveBeenCalledWith(userId, expect.objectContaining({
        updated_at: expect.any(Date),
      }));
    });
  });

  describe('changePassword', () => {
    it('should change password with valid credentials', async () => {
      // Given: 正しい現在パスワードと新パスワード
      const userId = mockUser.id;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(true);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('newHashedPassword');
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'removeAllUserSessions').mockResolvedValue(undefined);

      // When: changePassword を実行
      await userService.changePassword(userId, changePasswordDto);

      // Then: パスワードが変更される
      expect(passwordService.validatePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password_hash
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(changePasswordDto.newPassword);
      expect(databaseService.updateUser).toHaveBeenCalledWith(userId, expect.objectContaining({
        password_hash: 'newHashedPassword',
      }));
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      // Given: 間違った現在パスワード
      const userId = mockUser.id;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(false);

      // When: changePassword を実行
      // Then: UnauthorizedException を投げる
      await expect(userService.changePassword(userId, changePasswordDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should hash new password', async () => {
      // Given: 平文の新パスワード
      const userId = mockUser.id;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'plainNewPassword',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(true);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashedNewPassword');
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'removeAllUserSessions').mockResolvedValue(undefined);

      // When: changePassword を実行
      await userService.changePassword(userId, changePasswordDto);

      // Then: 新パスワードがハッシュ化される
      expect(passwordService.hashPassword).toHaveBeenCalledWith('plainNewPassword');
      expect(databaseService.updateUser).toHaveBeenCalledWith(userId, expect.objectContaining({
        password_hash: 'hashedNewPassword',
      }));
    });

    it('should invalidate all user sessions', async () => {
      // Given: パスワード変更データ
      const userId = mockUser.id;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(true);
      jest.spyOn(passwordService, 'hashPassword').mockResolvedValue('hashedPassword');
      jest.spyOn(databaseService, 'updateUser').mockResolvedValue(mockUser);
      jest.spyOn(databaseService, 'removeAllUserSessions').mockResolvedValue(undefined);

      // When: changePassword を実行
      await userService.changePassword(userId, changePasswordDto);

      // Then: ユーザーの全セッションが無効化される
      expect(databaseService.removeAllUserSessions).toHaveBeenCalledWith(userId);
    });

    it('should reject same password as current', async () => {
      // Given: 現在と同じパスワード
      const userId = mockUser.id;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'samePassword',
        newPassword: 'samePassword',
      };

      jest.spyOn(databaseService, 'getUserById').mockResolvedValue(mockUser);
      jest.spyOn(passwordService, 'validatePassword').mockResolvedValue(true);

      // When: changePassword を実行
      // Then: BadRequestException を投げる
      await expect(userService.changePassword(userId, changePasswordDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('searchUsers', () => {
    it('should return users matching search query', async () => {
      // Given: 検索クエリ
      const query = 'test';
      const limit = 20;
      const offset = 0;

      const mockUsers = [mockUser];
      // Mock Supabase client to return test data
      const mockSupabaseData = [
        {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          display_name: mockUser.display_name,
          birth_date: mockUser.birth_date,
          avatar_url: mockUser.profile_image_url,
          role: mockUser.role,
          created_at: mockUser.created_at.toISOString(),
          updated_at: mockUser.updated_at.toISOString(),
        }
      ];
      
      // Override the databaseService mock for this test
      const searchMockClient = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            or: jest.fn(() => ({
              range: jest.fn(() => ({
                order: jest.fn(() => Promise.resolve({ data: mockSupabaseData, error: null, count: 1 })),
              })),
            })),
          })),
        })),
      };
      
      databaseService.getAdminClient.mockReturnValue(searchMockClient);

      // When: searchUsers を実行
      const result = await userService.searchUsers({ query, page: 1, limit });

      // Then: マッチするユーザーのリストを返す
      expect(result).toEqual({
        users: expect.any(Array),
        total: 1,
      });
      expect(result.users).toHaveLength(1);
      expect(result.users[0]).toMatchObject({
        id: mockUser.id,
        username: mockUser.username,
        displayName: mockUser.display_name,
      });
    });

    it('should respect limit parameter', async () => {
      // Given: limit パラメータ
      const query = 'test';
      const limit = 5;
      const offset = 0;

      jest.spyOn(databaseService, 'searchUsers').mockResolvedValue({ users: [], total: 0 });

      // When: searchUsers を実行
      await userService.searchUsers(query, limit, offset);

      // Then: 指定した件数以下でユーザーを返す
      expect(databaseService.searchUsers).toHaveBeenCalledWith(query, limit, offset);
    });

    it('should return empty array for no matches', async () => {
      // Given: マッチしない検索クエリ
      const query = 'nomatch';
      const limit = 20;
      const offset = 0;

      jest.spyOn(databaseService, 'searchUsers').mockResolvedValue({ users: [], total: 0 });

      // When: searchUsers を実行
      const result = await userService.searchUsers({ query, page: 1, limit });

      // Then: 空の配列を返す
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});