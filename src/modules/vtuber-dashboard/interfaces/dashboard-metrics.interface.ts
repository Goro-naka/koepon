export interface RevenueDataPoint {
  date: string;
  revenue: number;
  gachaRevenue: number;
  medalRevenue: number;
}

export interface VTuberRevenue {
  vtuberId: string;
  channelName: string;
  totalRevenue: number;
  growth: number;
  rank: number;
}

export interface GachaPerformance {
  gachaId: string;
  gachaName: string;
  totalPlays: number;
  revenue: number;
  conversionRate: number;
  averageSpend: number;
}

export interface RetentionData {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

export interface RewardPopularity {
  rewardId: string;
  rewardName: string;
  distributionCount: number;
  popularityScore: number;
}

export interface InventoryStatus {
  itemId: string;
  itemName: string;
  currentStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface DashboardMetrics {
  // 売上関連
  totalRevenue: number;
  revenueGrowth: number;
  revenueByPeriod: RevenueDataPoint[];
  revenueByVTuber: VTuberRevenue[];
  
  // ガチャ関連
  totalGachaPlays: number;
  gachaPlayGrowth: number;
  gachaRevenueShare: number;
  topPerformingGachas: GachaPerformance[];
  
  // ユーザー関連
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userRetention: RetentionData;
  
  // 特典関連
  totalRewardsDistributed: number;
  popularRewards: RewardPopularity[];
  inventoryStatus: InventoryStatus[];
}

export interface ReportSummary {
  totalRevenue: number;
  totalUsers: number;
  totalGachaPlays: number;
  keyInsights: string[];
  performanceScore: number;
}

export interface DashboardFilter {
  startDate?: Date;
  endDate?: Date;
  vtuberId?: string;
  includeInactive?: boolean;
  groupBy?: 'day' | 'week' | 'month';
}