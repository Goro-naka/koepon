import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminSupabaseService } from './admin-supabase.service';

@ApiTags('Admin')
@Controller('api/v1/admin')
export class AdminSupabaseController {
  constructor(private readonly adminSupabaseService: AdminSupabaseService) {}

  @Get('dashboard-stats')
  @ApiOperation({ summary: '管理画面ダッシュボード統計を取得' })
  @ApiResponse({ status: 200, description: 'ダッシュボード統計データを返す' })
  async getDashboardStats() {
    return this.adminSupabaseService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'ユーザー一覧を取得' })
  @ApiResponse({ status: 200, description: 'ユーザー一覧データを返す' })
  async getUsers() {
    return this.adminSupabaseService.getUsers();
  }
}