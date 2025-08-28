import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RewardService } from './reward.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { RewardQueryDto, UserRewardQueryDto } from './dto/reward-query.dto';

@ApiTags('Rewards')
@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vtuber', 'admin')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload reward file (VTuber/Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Reward uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - VTuber/Admin access required' })
  async uploadReward(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body(ValidationPipe) createRewardDto: CreateRewardDto,
  ) {
    // Validate authentication
    if (!req.user || (req.user.role !== 'VTUBER' && req.user.role !== 'ADMIN')) {
      throw new ForbiddenException('VTuber or Admin access required');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Basic file validation
    const allowedTypes = ['image/', 'audio/', 'video/', 'text/', 'application/pdf'];
    if (!allowedTypes.some(type => file.mimetype.startsWith(type))) {
      throw new BadRequestException('Invalid file type');
    }

    // Determine vtuberId
    const vtuberId = req.user.role === 'ADMIN' && createRewardDto.vtuberId
      ? createRewardDto.vtuberId
      : req.user.vtuberId || req.user.sub;

    const metadata = {
      vtuberId,
      name: createRewardDto.name,
      description: createRewardDto.description,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      downloadLimit: createRewardDto.downloadLimit,
    };

    const reward = await this.rewardService.uploadReward(file.buffer, metadata);

    return {
      success: true,
      data: reward,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all rewards (Admin only)' })
  @ApiResponse({ status: 200, description: 'Rewards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async findAll(@Request() req, @Query(ValidationPipe) query: RewardQueryDto) {
    const result = await this.rewardService.findAll(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('box')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user reward box' })
  @ApiResponse({ status: 200, description: 'User rewards retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRewards(@Request() req, @Query(ValidationPipe) query: UserRewardQueryDto) {
    const result = await this.rewardService.getUserRewards(req.user.sub, query);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reward details' })
  @ApiResponse({ status: 200, description: 'Reward details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    const reward = await this.rewardService.findOne(id);
    return {
      success: true,
      data: { reward },
    };
  }

  @Post(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate download URL for reward' })
  @ApiResponse({ status: 200, description: 'Download URL generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied to reward' })
  @ApiResponse({ status: 429, description: 'Download limit exceeded' })
  async generateDownloadUrl(@Request() req, @Param('id') id: string) {
    const result = await this.rewardService.generateDownloadUrl(req.user.sub, id);
    return {
      success: true,
      data: result,
    };
  }

  @Get('download/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get download history' })
  @ApiResponse({ status: 200, description: 'Download history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDownloadHistory(@Request() req, @Query() query: any) {
    const result = await this.rewardService.getDownloadHistory(req.user.sub, query);
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vtuber', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update reward (VTuber/Admin only)' })
  @ApiResponse({ status: 200, description: 'Reward updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateRewardDto>,
  ) {
    const reward = await this.rewardService.update(id, updateData);
    return {
      success: true,
      data: reward,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vtuber', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete reward (VTuber/Admin only)' })
  @ApiResponse({ status: 200, description: 'Reward deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.rewardService.remove(id);
    return {
      success: true,
    };
  }
}