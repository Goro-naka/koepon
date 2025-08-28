import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../test/test-helpers';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;
  let loggerService: CustomLoggerService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'FAN',
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: mockUser,
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
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
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: CustomLoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    loggerService = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('canActivate', () => {
    it('should allow access for correct role', () => {
      // Given: ADMIN ロールが必要、ユーザーが ADMIN
      const adminUser = { ...mockUser, role: 'ADMIN' };
      const adminContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: adminUser,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(adminContext);

      // Then: true を返す
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        adminContext.getHandler(),
        adminContext.getClass(),
      ]);
    });

    it('should deny access for insufficient role', () => {
      // Given: ADMIN ロールが必要、ユーザーが FAN
      const fanUser = { ...mockUser, role: 'FAN' };
      const fanContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: fanUser,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(fanContext);

      // Then: false を返す
      expect(result).toBe(false);
      expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
        'INSUFFICIENT_ROLE_ACCESS',
        { 
          userId: fanUser.id, 
          userRole: fanUser.role, 
          requiredRoles: ['ADMIN'] 
        },
        'Access denied due to insufficient role'
      );
    });

    it('should allow access for multiple valid roles', () => {
      // Given: ADMIN または VTUBER が必要、ユーザーが VTUBER
      const vtuberUser = { ...mockUser, role: 'VTUBER' };
      const vtuberContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: vtuberUser,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'VTUBER']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(vtuberContext);

      // Then: true を返す
      expect(result).toBe(true);
    });

    it('should allow access when no roles required', () => {
      // Given: ロール指定なし
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(mockExecutionContext);

      // Then: true を返す
      expect(result).toBe(true);
    });

    it('should allow access when empty roles array', () => {
      // Given: 空のロール配列
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(mockExecutionContext);

      // Then: true を返す
      expect(result).toBe(true);
    });

    it('should deny access when user is not authenticated', () => {
      // Given: 認証されていないユーザー
      const unauthenticatedContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: null,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(unauthenticatedContext);

      // Then: false を返す
      expect(result).toBe(false);
      expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
        'UNAUTHENTICATED_ACCESS_ATTEMPT',
        { requiredRoles: ['ADMIN'] },
        'Access denied: user not authenticated'
      );
    });

    it('should handle user without role property', () => {
      // Given: ロールプロパティがないユーザー
      const userWithoutRole = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      };
      const contextWithoutRole = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: userWithoutRole,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(contextWithoutRole);

      // Then: false を返す
      expect(result).toBe(false);
      expect(loggerService.logSecurityEvent).toHaveBeenCalledWith(
        'MISSING_USER_ROLE',
        { userId: userWithoutRole.id },
        'Access denied: user role not found'
      );
    });

    it('should handle case-sensitive role comparison', () => {
      // Given: 大文字小文字の異なるロール
      const userWithLowercaseRole = { ...mockUser, role: 'admin' };
      const caseContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: userWithLowercaseRole,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(caseContext);

      // Then: false を返す（大文字小文字を区別）
      expect(result).toBe(false);
    });

    it('should allow access for exact role match in multiple roles', () => {
      // Given: 複数のロールの中で正確にマッチするもの
      const fanUser = { ...mockUser, role: 'FAN' };
      const fanContext = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: fanUser,
          }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'VTUBER', 'FAN']);

      // When: canActivate を実行
      const result = rolesGuard.canActivate(fanContext);

      // Then: true を返す
      expect(result).toBe(true);
    });
  });
});