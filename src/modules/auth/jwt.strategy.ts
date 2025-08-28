import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserInfo } from './interfaces/user-info.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: CustomLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<UserInfo> {
    try {
      // Validate payload structure
      if (!payload.sub || !payload.email || !payload.role) {
        this.logger.logSecurityEvent(
          'MALFORMED_JWT_PAYLOAD',
          { payload },
          'JWT validation failed: malformed payload'
        );
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.databaseService.getUserById(payload.sub);
      
      if (!user) {
        this.logger.logSecurityEvent(
          'INVALID_JWT_USER',
          { userId: payload.sub },
          'JWT validation failed: user not found'
        );
        throw new UnauthorizedException('User not found');
      }

      // Check if user is deleted
      if (user.deleted_at) {
        this.logger.logSecurityEvent(
          'DELETED_USER_ACCESS_ATTEMPT',
          { userId: payload.sub },
          'JWT validation failed: user is deleted'
        );
        throw new UnauthorizedException('User account is deleted');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(
        'Database error during JWT validation',
        error.stack,
        'JwtStrategy'
      );
      throw error;
    }
  }
}