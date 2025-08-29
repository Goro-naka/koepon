import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Response } from 'express';

@ApiTags('Health')
@Controller()
export class HealthController {
  private readonly supabase: SupabaseClient;
  private readonly adminClient: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && anonKey && serviceRoleKey) {
      this.supabase = createClient(supabaseUrl, anonKey);
      this.adminClient = createClient(supabaseUrl, serviceRoleKey);
    } else {
      console.warn('Supabase configuration is missing - database features will be disabled');
      this.supabase = null as any;
      this.adminClient = null as any;
    }
  }

  @Get()
  @ApiOperation({ summary: 'サービストップページ' })
  @ApiResponse({ status: 200, description: 'サービス紹介ページを返す' })
  root(@Res() res: Response) {
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>こえポン！ - 個人VTuberのデジタルコンテンツプラットフォーム</title>
    ${process.env.NODE_ENV !== 'production' ? '<meta name="robots" content="noindex, nofollow">' : ''}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 4rem 2rem;
        }
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .hero p {
            font-size: 1.2rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }
        .features {
            padding: 4rem 0;
            background: #f8fafc;
        }
        .features h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #2d3748;
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .feature-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .feature-card h3 {
            color: #4f46e5;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        .cta {
            background: #2d3748;
            color: white;
            text-align: center;
            padding: 4rem 2rem;
        }
        .cta h2 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .cta p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .btn {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: background 0.3s;
        }
        .btn:hover {
            background: #3730a3;
        }
        .footer {
            background: #1a202c;
            color: white;
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🎪 こえポン！</h1>
        <p>個人VTuberのデジタルコンテンツを手軽に購入・収集できる新しいプラットフォーム</p>
    </div>

    <div class="features">
        <div class="container">
            <h2>サービス特徴</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>🎭 個人VTuber支援</h3>
                    <p>個人で活動するVTuberクリエイターの収益化をサポート。独自のデジタルコンテンツを簡単に販売できます。</p>
                </div>
                <div class="feature-card">
                    <h3>🎁 限定コンテンツ</h3>
                    <p>ボイス、イラスト、動画など、ファンだけが楽しめる限定デジタルコンテンツを提供します。</p>
                </div>
                <div class="feature-card">
                    <h3>🏅 推しメダルシステム</h3>
                    <p>お気に入りのVTuberを応援する「推しメダル」を集めて、特別な特典を獲得できます。</p>
                </div>
            </div>
        </div>
    </div>

    <div class="cta">
        <div class="container">
            <h2>近日公開予定</h2>
            <p>現在開発中です。リリースまでもうしばらくお待ちください。</p>
            <a href="/api/v1/docs" class="btn">API仕様書を見る</a>
        </div>
    </div>

    <div class="footer">
        <div class="container">
            <p>&copy; 2025 こえポン！ All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    res.send(html);
  }

  @Get('health')
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

  @Get('health/ready')
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

  @Get('health/database')
  @ApiOperation({ summary: 'データベース接続チェック' })
  @ApiResponse({ status: 200, description: 'データベース接続状況を返す' })
  async database() {
    return await this.checkHealth();
  }

  @Get('health/stats')
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
      if (!this.supabase) {
        return {
          status: 'unavailable',
          timestamp: new Date().toISOString(),
          details: { message: 'Database connection not configured' }
        };
      }
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
      if (!this.adminClient) {
        return { status: -1 as any, message: 'Database not configured' as any };
      }
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
