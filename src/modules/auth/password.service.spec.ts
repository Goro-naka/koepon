import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PasswordService', () => {
  let passwordService: PasswordService;
  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    passwordService = module.get<PasswordService>(PasswordService);
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should return hashed password', async () => {
      // Given: 平文パスワード
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      
      mockedBcrypt.hash.mockResolvedValue(hashedPassword);

      // When: hashPassword を実行
      const result = await passwordService.hashPassword(plainPassword);

      // Then: ハッシュ化されたパスワードを返す
      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
    });

    it('should generate different hashes for same password', async () => {
      // Given: 同じ平文パスワード
      const plainPassword = 'testPassword123';
      const hashedPassword1 = '$2b$12$hashedPasswordExample1';
      const hashedPassword2 = '$2b$12$hashedPasswordExample2';
      
      mockedBcrypt.hash
        .mockResolvedValueOnce(hashedPassword1)
        .mockResolvedValueOnce(hashedPassword2);

      // When: hashPassword を複数回実行
      const result1 = await passwordService.hashPassword(plainPassword);
      const result2 = await passwordService.hashPassword(plainPassword);

      // Then: 異なるハッシュを生成する（ソルト効果）
      expect(result1).toBe(hashedPassword1);
      expect(result2).toBe(hashedPassword2);
      expect(result1).not.toBe(result2);
      expect(bcrypt.hash).toHaveBeenCalledTimes(2);
    });

    it('should take reasonable time to hash', async () => {
      // Given: パスワード
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      
      mockedBcrypt.hash.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(hashedPassword), 50); // 50ms で完了する模擬実装
        });
      });

      // When: hashPassword を実行
      const startTime = Date.now();
      const result = await passwordService.hashPassword(plainPassword);
      const endTime = Date.now();

      // Then: 100ms以内で完了する
      expect(result).toBe(hashedPassword);
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle bcrypt errors', async () => {
      // Given: bcryptでエラーが発生
      const plainPassword = 'testPassword123';
      const bcryptError = new Error('Bcrypt hashing failed');
      
      mockedBcrypt.hash.mockRejectedValue(bcryptError);

      // When: hashPassword を実行
      // Then: エラーを再投げする
      await expect(passwordService.hashPassword(plainPassword)).rejects.toThrow(bcryptError);
    });
  });

  describe('validatePassword', () => {
    it('should return true for correct password', async () => {
      // Given: 正しいパスワードとハッシュ
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      
      mockedBcrypt.compare.mockResolvedValue(true);

      // When: validatePassword を実行
      const result = await passwordService.validatePassword(plainPassword, hashedPassword);

      // Then: true を返す
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should return false for incorrect password', async () => {
      // Given: 間違ったパスワードと正しいハッシュ
      const plainPassword = 'wrongPassword';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      // When: validatePassword を実行
      const result = await passwordService.validatePassword(plainPassword, hashedPassword);

      // Then: false を返す
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    });

    it('should handle invalid hash format', async () => {
      // Given: 無効な形式のハッシュ
      const plainPassword = 'testPassword123';
      const invalidHash = 'invalid_hash_format';
      
      mockedBcrypt.compare.mockResolvedValue(false);

      // When: validatePassword を実行
      const result = await passwordService.validatePassword(plainPassword, invalidHash);

      // Then: false を返す
      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, invalidHash);
    });

    it('should handle bcrypt compare errors', async () => {
      // Given: bcryptでエラーが発生
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      const bcryptError = new Error('Bcrypt compare failed');
      
      mockedBcrypt.compare.mockRejectedValue(bcryptError);

      // When: validatePassword を実行
      // Then: エラーを再投げする
      await expect(
        passwordService.validatePassword(plainPassword, hashedPassword)
      ).rejects.toThrow(bcryptError);
    });

    it('should take reasonable time to validate', async () => {
      // Given: パスワードとハッシュ
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2b$12$hashedPasswordExample';
      
      mockedBcrypt.compare.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(true), 30); // 30ms で完了する模擬実装
        });
      });

      // When: validatePassword を実行
      const startTime = Date.now();
      const result = await passwordService.validatePassword(plainPassword, hashedPassword);
      const endTime = Date.now();

      // Then: 100ms以内で完了する
      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});