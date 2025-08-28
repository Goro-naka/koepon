import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;
  let loggerService: CustomLoggerService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    role: 'FAN',
    profile_image_url: null,
    birth_date: new Date('1990-01-01'),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockRequest = {
    user: {
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
    },
  };

  beforeEach(async () => {
    const mockUserService = {
      registerUser: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      changePassword: jest.fn(),
      uploadAvatar: jest.fn(),
      deleteAvatar: jest.fn(),
      searchUsers: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logSecurityEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      // Given: 有効な登録データ
      const registerDto: RegisterUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        displayName: 'New User',
      };

      const registrationResult = {
        user: mockUser,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      };

      jest.spyOn(userService, 'registerUser').mockResolvedValue(registrationResult);

      // When: register を実行
      const result = await userController.register(registerDto);

      // Then: 登録結果を返す
      expect(result).toEqual({
        success: true,
        data: registrationResult,
        message: 'User registered successfully',
      });
      expect(userService.registerUser).toHaveBeenCalledWith(registerDto);
    });

    it('should handle duplicate email error', async () => {
      // Given: 既存のメールアドレス
      const registerDto: RegisterUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'newuser',
        displayName: 'New User',
      };

      jest.spyOn(userService, 'registerUser').mockRejectedValue(
        new ConflictException('Email already exists')
      );

      // When & Then: ConflictException を投げる
      await expect(userController.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      // Given: 認証されたユーザー
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      // When: getProfile を実行
      const result = await userController.getProfile(mockRequest as any);

      // Then: ユーザープロフィールを返す
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
      expect(userService.getUserById).toHaveBeenCalledWith(mockRequest.user.id, mockRequest.user.id);
    });

    it('should handle user not found', async () => {
      // Given: 存在しないユーザー
      jest.spyOn(userService, 'getUserById').mockResolvedValue(null);

      // When & Then: NotFoundException を投げる
      await expect(userController.getProfile(mockRequest as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      // Given: 有効なユーザーID
      const userId = mockUser.id;
      jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUser);

      // When: getUserById を実行
      const result = await userController.getUserById(userId, mockRequest as any);

      // Then: ユーザー情報を返す
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
      expect(userService.getUserById).toHaveBeenCalledWith(userId, mockRequest.user.id);
    });

    it('should handle user not found', async () => {
      // Given: 存在しないユーザーID
      const userId = 'non-existent-id';
      jest.spyOn(userService, 'getUserById').mockResolvedValue(null);

      // When & Then: NotFoundException を投げる
      await expect(userController.getUserById(userId, mockRequest as any)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Given: 有効な更新データ
      const updateDto: UpdateUserDto = {
        username: 'updateduser',
        displayName: 'Updated User',
      };

      const updatedUser = { ...mockUser, ...updateDto };
      jest.spyOn(userService, 'updateUser').mockResolvedValue(updatedUser);

      // When: updateProfile を実行
      const result = await userController.updateProfile(updateDto, mockRequest as any);

      // Then: 更新されたユーザー情報を返す
      expect(result).toEqual({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
      expect(userService.updateUser).toHaveBeenCalledWith(mockRequest.user.id, updateDto);
    });

    it('should handle duplicate username error', async () => {
      // Given: 既存のユーザー名への変更
      const updateDto: UpdateUserDto = {
        username: 'existinguser',
      };

      jest.spyOn(userService, 'updateUser').mockRejectedValue(
        new ConflictException('Username already exists')
      );

      // When & Then: ConflictException を投げる
      await expect(userController.updateProfile(updateDto, mockRequest as any)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Given: 有効なパスワード変更データ
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      };

      jest.spyOn(userService, 'changePassword').mockResolvedValue(undefined);

      // When: changePassword を実行
      const result = await userController.changePassword(changePasswordDto, mockRequest as any);

      // Then: 成功メッセージを返す
      expect(result).toEqual({
        success: true,
        message: 'Password changed successfully',
      });
      expect(userService.changePassword).toHaveBeenCalledWith(mockRequest.user.id, changePasswordDto);
    });

    it('should handle invalid current password', async () => {
      // Given: 間違った現在パスワード
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
      };

      jest.spyOn(userService, 'changePassword').mockRejectedValue(
        new BadRequestException('Invalid current password')
      );

      // When & Then: BadRequestException を投げる
      await expect(
        userController.changePassword(changePasswordDto, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully', async () => {
      // Given: 有効な画像ファイル
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const avatarUrl = 'https://storage.example.com/avatar.jpg';
      jest.spyOn(userService, 'uploadAvatar').mockResolvedValue(avatarUrl);

      // When: uploadAvatar を実行
      const result = await userController.uploadAvatar(mockFile, mockRequest as any);

      // Then: アップロード結果を返す
      expect(result).toEqual({
        success: true,
        data: { profileImageUrl: avatarUrl },
        message: 'Avatar uploaded successfully',
      });
      expect(userService.uploadAvatar).toHaveBeenCalledWith(mockRequest.user.id, mockFile);
    });

    it('should handle file validation error', async () => {
      // Given: 無効なファイル形式
      const mockFile = {
        fieldname: 'avatar',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      jest.spyOn(userService, 'uploadAvatar').mockRejectedValue(
        new BadRequestException('Invalid file type')
      );

      // When & Then: BadRequestException を投げる
      await expect(userController.uploadAvatar(mockFile, mockRequest as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle missing file', async () => {
      // Given: ファイルなし
      const mockFile = undefined;

      // When & Then: BadRequestException を投げる
      await expect(
        userController.uploadAvatar(mockFile as any, mockRequest as any)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      // Given: アバターが設定されているユーザー
      jest.spyOn(userService, 'deleteAvatar').mockResolvedValue(undefined);

      // When: deleteAvatar を実行
      const result = await userController.deleteAvatar(mockRequest as any);

      // Then: 削除成功メッセージを返す
      expect(result).toEqual({
        success: true,
        message: 'Avatar deleted successfully',
      });
      expect(userService.deleteAvatar).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      // Given: 検索パラメータ
      const query = 'test';
      const limit = 20;
      const offset = 0;

      const searchResult = {
        users: [mockUser],
        total: 1,
        limit,
        offset,
      };

      jest.spyOn(userService, 'searchUsers').mockResolvedValue(searchResult);

      // When: searchUsers を実行
      const result = await userController.searchUsers(query, limit, offset);

      // Then: 検索結果を返す
      expect(result).toEqual({
        success: true,
        data: searchResult,
      });
      expect(userService.searchUsers).toHaveBeenCalledWith(query, limit, offset);
    });

    it('should handle empty search query', async () => {
      // Given: 空の検索クエリ
      const query = '';
      const limit = 20;
      const offset = 0;

      // When & Then: BadRequestException を投げる
      await expect(userController.searchUsers(query, limit, offset)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle invalid limit', async () => {
      // Given: 無効なlimit値
      const query = 'test';
      const limit = 200; // 最大100を超える
      const offset = 0;

      // When & Then: BadRequestException を投げる
      await expect(userController.searchUsers(query, limit, offset)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});