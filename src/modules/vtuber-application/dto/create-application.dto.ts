import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString, IsUrl, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateApplicationDto {
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value.trim())
  channelName: string;

  @IsString()
  @Length(1, 2000)
  @Transform(({ value }) => value.trim())
  channelDescription: string;

  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  channelUrl?: string;

  @IsOptional()
  socialLinks?: Record<string, string>;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  streamingPlatforms: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  contentGenres: string[];

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  streamingSchedule?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  identityDocument?: string;

  @IsOptional()
  @IsString()
  activityProof?: string;

  @IsOptional()
  @IsString()
  businessPlan?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalDocuments?: string[];
}