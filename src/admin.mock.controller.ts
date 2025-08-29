import { Controller, Get, Post } from '@nestjs/common';
import { AdminSupabaseService } from './modules/admin/admin-supabase.service';

@Controller('admin')
export class AdminMockController {
  constructor(private adminSupabaseService: AdminSupabaseService) {}
  
  @Get('dashboard/stats')
  async getDashboardStats() {
    return await this.adminSupabaseService.getDashboardStats();
  }

  @Get('users')
  async getUsers() {
    return await this.adminSupabaseService.getUsers();
  }


  @Get('vtubers')
  getVTubers() {
    return [
      {
        id: '1',
        applicant: {
          id: 'app1',
          channelName: '星月ひな Ch.',
          email: 'hina@example.com',
          applicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        status: 'under_review',
        priority: 'high',
        reviewHistory: [
          {
            id: 'rev1',
            reviewerId: 'admin1',
            reviewerName: '管理者A',
            action: 'review_started',
            comment: '申請内容を確認中です',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        currentReviewer: '管理者A',
        estimatedReviewTime: '2-3日'
      },
      {
        id: '2',
        applicant: {
          id: 'app2',
          channelName: '桜井みお Ch.',
          email: 'mio@example.com',
          applicationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        status: 'pending',
        priority: 'medium',
        reviewHistory: [],
        estimatedReviewTime: '5-7日'
      },
      {
        id: '3',
        applicant: {
          id: 'app3',
          channelName: '音羽ゆめ Ch.',
          email: 'yume@example.com',
          applicationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        status: 'requires_info',
        priority: 'low',
        reviewHistory: [
          {
            id: 'rev2',
            reviewerId: 'admin2',
            reviewerName: '管理者B',
            action: 'info_requested',
            comment: '追加の本人確認書類が必要です',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ],
        currentReviewer: '管理者B',
        estimatedReviewTime: '申請者の対応待ち'
      }
    ];
  }

  @Get('vtubers/:id/review')
  getVTuberReview() {
    return {
      success: true,
      application: {
        id: '1',
        vtuberName: '新規VTuber申請者',
        channelUrl: 'https://youtube.com/@example',
        subscriberCount: 10000,
        description: 'テスト申請です',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        documents: [
          { type: 'identity', verified: false },
          { type: 'channel_ownership', verified: true }
        ]
      }
    };
  }

  @Post('vtubers/:id/approve')
  approveVTuber() {
    return {
      success: true,
      message: 'VTuber application approved',
      applicationId: '1'
    };
  }

  @Post('vtubers/:id/reject')
  rejectVTuber() {
    return {
      success: true,
      message: 'VTuber application rejected',
      applicationId: '1',
      reason: 'Test rejection'
    };
  }

  @Get('gacha/probability')
  getGachaProbability() {
    return {
      success: true,
      settings: {
        N: { rate: 60.0, minValue: 50, maxValue: 70 },
        R: { rate: 25.0, minValue: 20, maxValue: 30 },
        SR: { rate: 10.0, minValue: 5, maxValue: 15 },
        SSR: { rate: 4.0, minValue: 1, maxValue: 5 },
        UR: { rate: 1.0, minValue: 0.1, maxValue: 2 }
      }
    };
  }

  @Post('gacha/probability')
  updateGachaProbability() {
    return {
      success: true,
      message: 'Gacha probability settings updated',
      settings: { updated: true }
    };
  }

  // VTuber CRUD operations
  @Post('vtubers')
  createVTuber() {
    const newVTuber = {
      id: String(Date.now()),
      applicant: {
        id: `app${Date.now()}`,
        channelName: '新規VTuber',
        email: 'new@example.com',
        applicationDate: new Date().toISOString()
      },
      status: 'pending',
      priority: 'medium',
      reviewHistory: [],
      estimatedReviewTime: '5-7日'
    };
    
    return {
      success: true,
      message: 'VTuber application created successfully',
      data: newVTuber
    };
  }

  @Post('vtubers/:id')
  updateVTuber() {
    return {
      success: true,
      message: 'VTuber application updated successfully',
      data: { id: '1', updated: true }
    };
  }

  @Post('vtubers/:id/delete')
  deleteVTuber() {
    return {
      success: true,
      message: 'VTuber application deleted successfully',
      deletedId: '1'
    };
  }

  // Gacha CRUD operations
  @Get('gacha')
  getGachaList() {
    return [
      {
        id: '1',
        title: '星月ひな 限定ガチャ',
        vtuberName: '星月ひな',
        description: '限定ボイス・写真・動画が当たる特別ガチャ',
        status: 'active',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        totalDraws: 1250,
        revenue: 125000,
        items: 15
      },
      {
        id: '2',
        title: '桜井みお 春の記念ガチャ',
        vtuberName: '桜井みお',
        description: '春の思い出をテーマにした限定コンテンツ',
        status: 'active',
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
        totalDraws: 890,
        revenue: 89000,
        items: 12
      },
      {
        id: '3',
        title: '音羽ゆめ デビュー記念ガチャ',
        vtuberName: '音羽ゆめ',
        description: 'デビュー記念の特別限定コンテンツ',
        status: 'draft',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
        totalDraws: 0,
        revenue: 0,
        items: 8
      }
    ];
  }

  @Post('gacha')
  createGacha() {
    const newGacha = {
      id: String(Date.now()),
      title: '新規ガチャ',
      vtuberName: '未選択',
      description: 'ガチャの説明',
      status: 'draft',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      totalDraws: 0,
      revenue: 0,
      items: 0
    };
    
    return {
      success: true,
      message: 'Gacha created successfully',
      data: newGacha
    };
  }

  @Post('gacha/:id')
  updateGacha() {
    return {
      success: true,
      message: 'Gacha updated successfully',
      data: { id: '1', updated: true }
    };
  }

  @Post('gacha/:id/delete')
  deleteGacha() {
    return {
      success: true,
      message: 'Gacha deleted successfully',
      deletedId: '1'
    };
  }

  @Get('system/monitoring')
  getSystemMonitoring() {
    return {
      server: 'healthy',
      database: 'connected',
      redis: 'connected',
      uptime: 86400
    };
  }
}