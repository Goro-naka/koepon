import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DrawGachaDto {
  @ApiProperty({ 
    description: 'Number of draws to execute', 
    example: 1, 
    minimum: 1, 
    maximum: 10,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  drawCount?: number = 1;
}