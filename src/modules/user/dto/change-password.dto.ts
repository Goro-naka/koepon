import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Current password',
    example: 'currentPassword123'
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ 
    description: 'New password (8 characters minimum)',
    example: 'newSecurePassword123',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}