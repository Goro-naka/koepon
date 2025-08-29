// モックAPIデータ (バックエンドが利用できない場合のフォールバック用)

export const mockDashboardData = {
  systemOverview: {
    totalUsers: 1234,
    newUsersToday: 12,
    newUsersThisMonth: 89,
    totalVTubers: 89,
    pendingApplications: 3,
    approvalRate: 85.6,
    totalRevenue: 1234567,
    monthlyRevenue: 234567,
    revenueGrowth: 12.5,
    activeUsersDAU: 234,
    activeUsersMAU: 567,
    systemAlerts: [
      {
        id: '1',
        level: 'warning' as const,
        message: 'High CPU usage detected on server-02',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        source: 'system_monitor'
      }
    ]
  },
  systemStatus: {
    apiResponseTime: 145,
    errorRate: 0.02,
    databaseStatus: 'healthy' as const,
    cacheHitRate: 94.2,
    storageUsage: {
      used: 234567890,
      total: 1000000000,
      percentage: 23.4
    }
  },
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  }
}

export const mockUsersData = [
  {
    id: '1',
    email: 'user1@example.com',
    displayName: 'ユーザー1',
    registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginDate: new Date().toISOString(),
    status: 'active' as const,
    totalGachaDraws: 45,
    totalSpent: 12000,
    medalBalance: 2500,
    rewardCount: 15,
    riskScore: 0.2
  },
  {
    id: '2',
    email: 'user2@example.com',
    displayName: 'ユーザー2',
    registrationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'active' as const,
    totalGachaDraws: 23,
    totalSpent: 8500,
    medalBalance: 1200,
    rewardCount: 8,
    riskScore: 0.1
  },
  {
    id: '3',
    email: 'user3@example.com',
    displayName: 'ユーザー3',
    registrationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'suspended' as const,
    totalGachaDraws: 120,
    totalSpent: 45000,
    medalBalance: 500,
    rewardCount: 35,
    riskScore: 0.8
  }
]

export const mockVTuberApplicationsData = [
  {
    id: '1',
    applicant: {
      id: 'app1',
      channelName: '星月ひな Ch.',
      email: 'hina@example.com',
      applicationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    status: 'under_review' as const,
    priority: 'high' as const,
    reviewHistory: [
      {
        id: 'rev1',
        reviewerId: 'admin1',
        reviewerName: '管理者A',
        action: 'review_started' as const,
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
    status: 'pending' as const,
    priority: 'medium' as const,
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
    status: 'requires_info' as const,
    priority: 'low' as const,
    reviewHistory: [
      {
        id: 'rev2',
        reviewerId: 'admin2',
        reviewerName: '管理者B',
        action: 'info_requested' as const,
        comment: '追加の本人確認書類が必要です',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ],
    currentReviewer: '管理者B',
    estimatedReviewTime: '申請者の対応待ち'
  }
]

export const mockSystemStatusData = {
  server: 'healthy' as const,
  database: 'connected' as const,
  redis: 'connected' as const,
  uptime: 86400
}

export const mockGachaData = [
  {
    id: '1',
    title: '星月ひな 限定ガチャ',
    vtuberName: '星月ひな',
    description: '限定ボイス・写真・動画が当たる特別ガチャ',
    status: 'active' as const,
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
    status: 'active' as const,
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
    status: 'draft' as const,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(),
    totalDraws: 0,
    revenue: 0,
    items: 8
  }
]