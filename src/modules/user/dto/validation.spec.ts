import { validate } from 'class-validator';
import { RegisterUserDto } from './register-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { ChangePasswordDto } from './change-password.dto';

describe('User DTOs Validation', () => {
  describe('RegisterUserDto', () => {
    it('should validate email format', async () => {
      // Given: 無効なメールアドレス形式
      const dto = new RegisterUserDto();
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.displayName = 'Test User';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find(err => err.property === 'email');
      expect(emailError).toBeDefined();
      expect(emailError?.constraints).toHaveProperty('isEmail');
    });

    it('should validate password length', async () => {
      // Given: 8文字未満のパスワード
      const dto = new RegisterUserDto();
      dto.email = 'test@example.com';
      dto.password = '1234567'; // 7文字
      dto.username = 'testuser';
      dto.displayName = 'Test User';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find(err => err.property === 'password');
      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints).toHaveProperty('minLength');
    });

    it('should validate username length and format', async () => {
      // Given: 3文字未満のユーザー名
      const shortUsernameDto = new RegisterUserDto();
      shortUsernameDto.email = 'test@example.com';
      shortUsernameDto.password = 'password123';
      shortUsernameDto.username = 'ab'; // 2文字
      shortUsernameDto.displayName = 'Test User';

      // When: バリデーションを実行
      const shortUsernameErrors = await validate(shortUsernameDto);

      // Then: バリデーションエラーを投げる
      expect(shortUsernameErrors.length).toBeGreaterThan(0);
      const usernameError = shortUsernameErrors.find(err => err.property === 'username');
      expect(usernameError).toBeDefined();
      expect(usernameError?.constraints).toHaveProperty('minLength');

      // Given: 20文字超のユーザー名
      const longUsernameDto = new RegisterUserDto();
      longUsernameDto.email = 'test@example.com';
      longUsernameDto.password = 'password123';
      longUsernameDto.username = 'a'.repeat(21); // 21文字
      longUsernameDto.displayName = 'Test User';

      // When: バリデーションを実行
      const longUsernameErrors = await validate(longUsernameDto);

      // Then: バリデーションエラーを投げる
      expect(longUsernameErrors.length).toBeGreaterThan(0);
      const longUsernameError = longUsernameErrors.find(err => err.property === 'username');
      expect(longUsernameError).toBeDefined();
      expect(longUsernameError?.constraints).toHaveProperty('maxLength');
    });

    it('should validate display name length', async () => {
      // Given: 50文字を超える表示名
      const dto = new RegisterUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.displayName = 'a'.repeat(51); // 51文字

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const displayNameError = errors.find(err => err.property === 'displayName');
      expect(displayNameError).toBeDefined();
      expect(displayNameError?.constraints).toHaveProperty('maxLength');
    });

    it('should validate birth date format', async () => {
      // Given: YYYY-MM-DD以外の形式の生年月日
      const dto = new RegisterUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.displayName = 'Test User';
      dto.birthDate = '01/01/1990'; // 無効な形式

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const birthDateError = errors.find(err => err.property === 'birthDate');
      expect(birthDateError).toBeDefined();
      expect(birthDateError?.constraints).toHaveProperty('isDateString');
    });

    it('should pass validation with valid data', async () => {
      // Given: 有効なデータ
      const dto = new RegisterUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.displayName = 'Test User';
      dto.birthDate = '1990-01-01';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });

    it('should pass validation without optional birth date', async () => {
      // Given: 生年月日なしの有効なデータ
      const dto = new RegisterUserDto();
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.username = 'testuser';
      dto.displayName = 'Test User';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateUserDto', () => {
    it('should pass validation with partial update data', async () => {
      // Given: 一部のフィールドのみの更新データ
      const dto = new UpdateUserDto();
      dto.displayName = 'Updated Display Name';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });

    it('should validate username constraints when provided', async () => {
      // Given: 制約に違反するユーザー名
      const dto = new UpdateUserDto();
      dto.username = 'ab'; // 短すぎる

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const usernameError = errors.find(err => err.property === 'username');
      expect(usernameError).toBeDefined();
      expect(usernameError?.constraints).toHaveProperty('minLength');
    });

    it('should validate display name constraints when provided', async () => {
      // Given: 制約に違反する表示名
      const dto = new UpdateUserDto();
      dto.displayName = 'a'.repeat(51); // 長すぎる

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const displayNameError = errors.find(err => err.property === 'displayName');
      expect(displayNameError).toBeDefined();
      expect(displayNameError?.constraints).toHaveProperty('maxLength');
    });

    it('should pass validation with empty dto', async () => {
      // Given: 空のDTO
      const dto = new UpdateUserDto();

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない（全てオプショナル）
      expect(errors.length).toBe(0);
    });
  });

  describe('ChangePasswordDto', () => {
    it('should validate current password is not empty', async () => {
      // Given: 空の現在パスワード
      const dto = new ChangePasswordDto();
      dto.currentPassword = '';
      dto.newPassword = 'newPassword123';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const currentPasswordError = errors.find(err => err.property === 'currentPassword');
      expect(currentPasswordError).toBeDefined();
      expect(currentPasswordError?.constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate new password length', async () => {
      // Given: 8文字未満の新パスワード
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'currentPassword';
      dto.newPassword = '1234567'; // 7文字

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーを投げる
      expect(errors.length).toBeGreaterThan(0);
      const newPasswordError = errors.find(err => err.property === 'newPassword');
      expect(newPasswordError).toBeDefined();
      expect(newPasswordError?.constraints).toHaveProperty('minLength');
    });

    it('should pass validation with valid passwords', async () => {
      // Given: 有効なパスワードデータ
      const dto = new ChangePasswordDto();
      dto.currentPassword = 'currentPassword123';
      dto.newPassword = 'newPassword123';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });
  });
});