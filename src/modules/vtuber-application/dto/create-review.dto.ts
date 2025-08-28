import { IsEnum, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ReviewDecision } from '../enums/review-decision.enum';

export class CreateReviewDto {
  @IsEnum(ReviewDecision)
  decision: ReviewDecision;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  reviewComments?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  score?: number;

  @IsOptional()
  checklistItems?: Record<string, boolean>;
}