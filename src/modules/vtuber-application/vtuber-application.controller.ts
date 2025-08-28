import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VTuberApplicationService } from './vtuber-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ReviewStage } from './enums/review-stage.enum';

@Controller('api/v1/vtuber')
export class VTuberApplicationController {
  constructor(private readonly applicationService: VTuberApplicationService) {}

  @Post('applications')
  @UseGuards(JwtAuthGuard)
  async createApplication(@Request() req: any, @Body() createDto: CreateApplicationDto) {
    this.validateApplicationInput(createDto);

    const application = await this.applicationService.createApplication(req.user.sub, createDto);
    return {
      success: true,
      data: { application },
    };
  }

  private validateApplicationInput(createDto: CreateApplicationDto): void {
    if (!createDto.channelName || createDto.channelName.trim().length === 0) {
      throw new BadRequestException('Channel name is required');
    }
    if (!createDto.streamingPlatforms || createDto.streamingPlatforms.length === 0) {
      throw new BadRequestException('At least one streaming platform is required');
    }
    if (this.containsSuspiciousContent(createDto.channelName)) {
      throw new BadRequestException('Invalid characters detected');
    }
  }

  private containsSuspiciousContent(text: string): boolean {
    const suspiciousPatterns = ['<script>', '<iframe>', 'javascript:', 'data:', 'vbscript:'];
    return suspiciousPatterns.some(pattern => text.toLowerCase().includes(pattern));
  }

  @Get('applications/:id')
  @UseGuards(JwtAuthGuard)
  async getApplication(@Param('id') id: string) {
    const application = await this.applicationService.getApplication(id);
    return {
      success: true,
      data: { application },
    };
  }

  @Put('applications/:id')
  @UseGuards(JwtAuthGuard)
  async updateApplication(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateApplicationDto) {
    const application = await this.applicationService.updateApplication(id, updateDto);
    return {
      success: true,
      data: { application },
    };
  }

  @Get('applications/my')
  @UseGuards(JwtAuthGuard)
  async getMyApplications(@Request() req: any, @Query() pagination: PaginationDto) {
    const result = await this.applicationService.getUserApplications(req.user.sub, pagination);
    return {
      success: true,
      data: result,
    };
  }

  @Get('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('REVIEWER', 'ADMIN')
  async getReviewerAssignments(@Request() req: any, @Query() pagination: PaginationDto) {
    const result = await this.applicationService.getReviewerAssignments(req.user.sub, pagination);
    return {
      success: true,
      data: result,
    };
  }

  @Put('reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('REVIEWER', 'ADMIN')
  async updateReview(@Param('id') id: string, @Body() reviewDto: CreateReviewDto) {
    const review = await this.applicationService.createReview(id, reviewDto);
    return {
      success: true,
      data: { review },
    };
  }

  @Get('admin/applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllApplications(@Query() pagination: PaginationDto) {
    const result = await this.applicationService.getUserApplications('', pagination);
    return {
      success: true,
      data: result,
    };
  }

  @Post('admin/applications/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async assignReviewer(@Param('id') applicationId: string, @Body() assignmentDto: any) {
    const review = await this.applicationService.assignReviewer(
      applicationId,
      assignmentDto.reviewerId,
      assignmentDto.reviewStage || ReviewStage.INITIAL_SCREENING
    );
    return {
      success: true,
      data: { review },
    };
  }

  @Post('admin/applications/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approveApplication(@Param('id') id: string) {
    const application = await this.applicationService.approveApplication(id);
    return {
      success: true,
      data: { application },
    };
  }

  @Post('admin/applications/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async rejectApplication(@Param('id') id: string, @Body() rejectionDto: any) {
    const application = await this.applicationService.rejectApplication(id, rejectionDto.reason);
    return {
      success: true,
      data: { application },
    };
  }

  @Get('admin/reviews/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getStatistics() {
    const stats = await this.applicationService.getApplicationStatistics();
    return {
      success: true,
      data: stats,
    };
  }
}