import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from './shared/types/supabase.types';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly supabase: SupabaseClient<Database>;
  private readonly adminClient: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient<Database>(supabaseUrl, anonKey);
    this.adminClient = createClient<Database>(supabaseUrl, serviceRoleKey);
  }

  @Get()
  @ApiOperation({ summary: 'サーバー基本ヘルスチェック' })
  @ApiResponse({ status: 200, description: 'サーバー稼働状況を返す' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '1.0.0',
      service: 'koepon-api',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'サーバー準備状況チェック' })
  @ApiResponse({ status: 200, description: 'サーバーとDBの準備状況を返す' })
  async ready() {
    const dbHealth = await this.checkHealth();
    
    return {
      status: dbHealth.status === 'healthy' ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        server: 'ok',
        database: dbHealth.status,
        supabase: 'connected',
      },
      details: {
        database: dbHealth.details,
      },
    };
  }

  @Get('database')
  @ApiOperation({ summary: 'データベース接続チェック' })
  @ApiResponse({ status: 200, description: 'データベース接続状況を返す' })
  async database() {
    return await this.checkHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'データベーステーブル統計' })
  @ApiResponse({ status: 200, description: '各テーブルのレコード数を返す' })
  async stats() {
    try {
      const tableStats = await this.getTableStats();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        tables: tableStats,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkHealth(): Promise<{ status: string; timestamp: string; details?: unknown }> {
    try {
      // Test basic connectivity with profiles table
      const { error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database health check failed:', error);
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: error.message },
        };
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: { connection: 'ok' },
      };
    } catch (error) {
      console.error('Database health check exception:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  private async getTableStats(): Promise<Record<string, number>> {
    try {
      const tables = ['profiles', 'vtubers', 'gachas', 'gacha_items', 'oshi_medals'];
      const stats: Record<string, number> = {};

      for (const table of tables) {
        const { count, error } = await this.adminClient
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.warn(`Failed to get stats for table ${table}:`, error);
          stats[table] = -1;
        } else {
          stats[table] = count ?? 0;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get table statistics:', error);
      throw error;
    }
  }
}
