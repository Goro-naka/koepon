import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ 
    description: 'Username (3-20 characters)',
    example: 'newUsername',
    minLength: 3,
    maxLength: 20,
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username?: string;

  @ApiProperty({ 
    description: 'Display name (1-50 characters)',
    example: 'New Display Name',
    maxLength: 50,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({ 
    description: 'Birth date (YYYY-MM-DD format)',
    example: '1990-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}