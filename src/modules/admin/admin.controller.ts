import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { AdminQueryDto, AuditLogQueryDto, SystemMetricsQueryDto, UserActionDto, UserManagementDto, VTuberActionDto, VTuberManagementDto } from './dto/admin-query.dto';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // システム監視API
  @Get('system/health')
  async getSystemHealth() {
    return this.adminService.getSystemHealthStatus();
  }

  @Get('system/metrics')
  async getSystemMetrics(@Query() queryDto: SystemMetricsQueryDto) {
    return this.adminService.getSystemMetrics(queryDto);
  }

  @Get('system/alerts')
  async getActiveAlerts() {
    return this.adminService.getActiveAlerts();
  }

  @Post('system/alerts/:id/acknowledge')
  async acknowledgeAlert(@Request() req: { user: { sub: string } }, @Param('id') alertId: string) {
    return this.adminService.acknowledgeAlert(alertId, req.user.sub);
  }

  @Get('system/services')
  async getServiceStatuses() {
    return this.adminService.getServiceStatuses();
  }

  // ユーザー管理API
  @Get('users')
  async listUsers(@Query() queryDto: UserManagementDto) {
    return this.adminService.listUsers(queryDto);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Post('users/:id/action')
  async performUserAction(@Request() req: { user: { sub: string } }, @Param('id') userId: string, @Body() actionDto: UserActionDto) {
    return this.adminService.performUserAction(userId, actionDto, req.user.sub);
  }

  // VTuber管理API
  @Get('vtubers')
  async listVTubers(@Query() queryDto: VTuberManagementDto) {
    return this.adminService.listVTubers(queryDto);
  }

  @Get('vtubers/:id')
  async getVTuberDetails(@Param('id') vtuberId: string) {
    return this.adminService.getVTuberDetails(vtuberId);
  }

  @Post('vtubers/:id/action')
  async performVTuberAction(@Request() req: { user: { sub: string } }, @Param('id') vtuberId: string, @Body() actionDto: VTuberActionDto) {
    return this.adminService.performVTuberAction(vtuberId, actionDto, req.user.sub);
  }

  // 分析・レポートAPI
  @Get('analytics/overview')
  async getAnalyticsOverview(@Query() queryDto: AdminQueryDto) {
    return this.adminService.getAnalyticsOverview();
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(@Query() queryDto: AdminQueryDto) {
    return this.adminService.getRevenueAnalytics();
  }

  @Get('analytics/users')
  async getUserAnalytics(@Query() queryDto: AdminQueryDto) {
    return this.adminService.getUserAnalytics();
  }

  @Get('analytics/content')
  async getContentAnalytics(@Query() queryDto: AdminQueryDto) {
    return this.adminService.getContentAnalytics(queryDto);
  }

  @Post('reports/generate')
  async generateReport(@Request() req: any, @Body() reportDto: any) {
    return this.adminService.generateReport(reportDto.type, reportDto, req.user.sub);
  }

  @Get('reports/:id/download')
  async downloadReport(@Request() req: any, @Param('id') reportId: string) {
    return this.adminService.downloadReport(reportId, req.user.sub);
  }

  // 監査ログAPI
  @Get('audit-logs')
  async getAuditLogs(@Request() _req: any, @Query() queryDto: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(queryDto);
  }

  @Get('audit-logs/:id')
  async getAuditLogDetails(@Request() _req: any, @Param('id') logId: string) {
    return this.adminService.getAuditLogDetails(logId);
  }

  @Get('audit-logs/search')
  async searchAuditLogs(@Request() _req: any, @Query() queryDto: AuditLogQueryDto) {
    return this.adminService.searchAuditLogs(queryDto);
  }

  @Post('audit-logs/export')
  async exportAuditLogs(@Request() req: any, @Body() queryDto: AuditLogQueryDto) {
    return this.adminService.exportAuditLogs(queryDto, req.user.sub);
  }
}