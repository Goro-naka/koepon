import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginResponse } from './interfaces/login-response.interface';
import { UserInfo } from './interfaces/user-info.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly logger: CustomLoggerService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserInfo | null> {
    try {
      const user = await this.databaseService.getUserByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await this.passwordService.validatePassword(
        password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      this.logger.error(
        'Database error during user validation',
        error.stack,
        'AuthService',
      );
      throw error;
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateUser(email, password);
    
    if (!user) {
      this.logger.logSecurityEvent(
        'FAILED_LOGIN_ATTEMPT',
        { email },
        'Failed login attempt'
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const accessToken = this.jwtService.sign(payload);
    
    // Generate refresh token (using a different secret or longer expiry)
    const refreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

    // Create session in database
    const session = await this.databaseService.createSession(user.id, refreshToken);

    this.logger.log(`User logged in successfully: ${user.email}`, 'AuthService');

    return {
      accessToken,
      refreshToken: session.refreshToken,
      user,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const session = await this.databaseService.getSessionByRefreshToken(refreshToken);
    
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.databaseService.getUserById(session.userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };

    const accessToken = this.jwtService.sign(payload);
    
    // Update session expiry
    await this.databaseService.updateSessionExpiry(session.id);

    this.logger.log(`Token refreshed for user: ${user.email}`, 'AuthService');

    return {
      accessToken,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.databaseService.removeSession(sessionId);
    this.logger.log(`User logged out, session: ${sessionId}`, 'AuthService');
  }
}