// 管理者画面用の型定義

export interface AdminDashboardMetrics {
  systemOverview: {
    totalUsers: number
    newUsersToday: number
    newUsersThisMonth: number
    totalVTubers: number
    pendingApplications: number
    approvalRate: number
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    activeUsersDAU: number
    activeUsersMAU: number
    systemAlerts: SystemAlert[]
  }
  systemStatus: {
    apiResponseTime: number
    errorRate: number
    databaseStatus: 'healthy' | 'warning' | 'critical'
    cacheHitRate: number
    storageUsage: {
      used: number
      total: number
      percentage: number
    }
  }
  dateRange: DateRange
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface SystemAlert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
  acknowledged: boolean
  source: string
}

export interface VTuberApplicationReview {
  id: string
  applicant: {
    id: string
    channelName: string
    email: string
    applicationDate: string
  }
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_info'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reviewHistory: ReviewAction[]
  currentReviewer?: string
  estimatedReviewTime?: string
}

export interface ReviewAction {
  id: string
  reviewerId: string
  reviewerName: string
  action: 'review_started' | 'approved' | 'rejected' | 'info_requested' | 'comment_added'
  comment?: string
  timestamp: string
}

export interface SystemMetrics {
  timestamp: string
  cpu: {
    usage: number
    cores: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    inbound: number
    outbound: number
  }
}

export interface ApiMetrics {
  endpoint: string
  method: string
  avgResponseTime: number
  requestCount: number
  errorCount: number
  errorRate: number
  p95ResponseTime: number
}

export interface AdminUserView {
  id: string
  email: string
  displayName: string
  registrationDate: string
  lastLoginDate: string
  status: 'active' | 'suspended' | 'deleted'
  totalGachaDraws: number
  totalSpent: number
  medalBalance: number
  rewardCount: number
  riskScore: number
}

export interface UserDetailView {
  basicInfo: AdminUserView
  gachaHistory: {
    id: string
    gachaId: string
    timestamp: string
    medalUsed: number
    results: string[]
  }[]
  paymentHistory: {
    id: string
    amount: number
    currency: string
    status: 'completed' | 'pending' | 'failed'
    timestamp: string
  }[]
  medalTransactions: {
    id: string
    type: 'earned' | 'spent'
    amount: number
    vtuber: string
    timestamp: string
  }[]
  rewardDownloads: {
    id: string
    rewardId: string
    rewardName: string
    downloadedAt: string
  }[]
  supportTickets: {
    id: string
    subject: string
    status: 'open' | 'pending' | 'resolved'
    createdAt: string
  }[]
  securityEvents: {
    id: string
    type: 'login' | 'logout' | 'password_change' | 'suspicious_activity'
    ipAddress: string
    timestamp: string
  }[]
}

export interface AdminAction {
  type: 'user_suspend' | 'user_restore' | 'vtuber_approve' | 'vtuber_reject' | 'medal_adjust' | 'reward_grant'
  targetId: string
  targetType: 'user' | 'vtuber' | 'system'
  reason?: string
  metadata?: Record<string, string | number | boolean>
}

export interface AdminFilters {
  dateRange: DateRange
  status?: string[]
  priority?: string[]
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface AlertThreshold {
  id: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals'
  threshold: number
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
  notifications: {
    email: boolean
    slack: boolean
    webhook?: string
  }
}