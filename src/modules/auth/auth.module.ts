import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { DatabaseModule } from '../database/database.module';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
    RolesGuard,
    CustomLoggerService,
  ],
  exports: [
    AuthService,
    PasswordService,
    JwtStrategy,
    RolesGuard,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}