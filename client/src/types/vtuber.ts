export interface VTuberInfo {
  id: string
  channelName: string
  description: string
  profileImage: string
  bannerImage: string
  socialMedia: {
    youtube?: string
    twitter?: string
    twitch?: string
  }
  status: 'pending' | 'approved' | 'rejected'
  joinedAt: string
  totalRevenue?: number
  fanCount?: number
}

export interface VTuberApplication {
  id: string
  channelName: string
  description: string
  socialMediaLinks: {
    youtube?: string
    twitter?: string
    twitch?: string
  }
  profileImage: File | string
  bannerImage: File | string
  activityProof: File[]
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface GachaManagementData {
  id: string
  title: string
  description: string
  price: number
  startDate: string
  endDate: string
  status: 'draft' | 'active' | 'inactive' | 'expired'
  thumbnailImage: string
  items: GachaItem[]
  totalDraws: number
  revenue: number
  createdAt: string
  updatedAt: string
}

export interface GachaItem {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  dropRate: number
  image: string
  category: string
  isSpecial?: boolean
}

export interface CreateGachaRequest {
  title: string
  description: string
  price: number
  startDate: string
  endDate: string
  thumbnailImage: File
  items: CreateGachaItem[]
}

export interface CreateGachaItem {
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  dropRate: number
  image: File
  category: string
}

export interface UpdateGachaRequest {
  title?: string
  description?: string
  price?: number
  startDate?: string
  endDate?: string
  status?: 'active' | 'inactive'
  items?: UpdateGachaItem[]
}

export interface UpdateGachaItem {
  id?: string
  name?: string
  description?: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  dropRate?: number
  image?: File | string
  category?: string
}

export interface DashboardMetrics {
  totalRevenue: number
  monthlyRevenue: number
  weeklyRevenue: number
  dailyRevenue: number
  fanCount: number
  fanGrowthRate: number
  totalGachaDraws: number
  averageRevenuePerUser: number
  topPerformingGacha: {
    id: string
    title: string
    revenue: number
  }
  recentActivities: Activity[]
  revenueChart: ChartDataPoint[]
  fanGrowthChart: ChartDataPoint[]
}

export interface Activity {
  id: string
  type: 'gacha_created' | 'gacha_draw' | 'fan_joined' | 'revenue_milestone'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface StatisticsData {
  revenueAnalytics: RevenueAnalytics
  fanDemographics: FanDemographics
  gachaRankings: GachaRanking[]
  activityHeatmap: HeatmapData[]
  conversionRates: ConversionData
  customReports: CustomReport[]
}

export interface RevenueAnalytics {
  totalRevenue: number
  periodicRevenue: {
    daily: ChartDataPoint[]
    weekly: ChartDataPoint[]
    monthly: ChartDataPoint[]
    yearly: ChartDataPoint[]
  }
  revenueBySource: {
    gacha: number
    medals: number
    other: number
  }
  averageOrderValue: number
  revenueGrowthRate: number
}

export interface FanDemographics {
  ageGroups: {
    range: string
    count: number
    percentage: number
  }[]
  genderDistribution: {
    male: number
    female: number
    other: number
  }
  geographicDistribution: {
    country: string
    count: number
    percentage: number
  }[]
  engagementLevels: {
    level: string
    count: number
    percentage: number
  }[]
}

export interface GachaRanking {
  id: string
  title: string
  revenue: number
  drawCount: number
  conversionRate: number
  popularityScore: number
  ranking: number
}

export interface HeatmapData {
  date: string
  hour: number
  activity: number
  value: number
}

export interface ConversionData {
  overallConversionRate: number
  gachaConversionRates: {
    gachaId: string
    title: string
    conversionRate: number
  }[]
  funnelAnalysis: {
    stage: string
    visitors: number
    conversions: number
    rate: number
  }[]
}

export interface CustomReport {
  id: string
  title: string
  description: string
  metrics: string[]
  dateRange: DateRange
  filters: ReportFilter[]
  createdAt: string
  lastGenerated?: string
  isScheduled: boolean
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly'
}

export interface ReportFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface DateRange {
  startDate: string
  endDate: string
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
}

export interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'completed' | 'failed'
  error?: string
}

export interface UploadError {
  fileId: string
  fileName: string
  error: string
  code: string
}

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other'

export interface ApplicationStatus {
  status: VTuberApplication['status']
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
  nextSteps?: string[]
}

// Form validation interfaces
export interface VTuberApplicationFormData {
  channelName: string
  description: string
  youtubeUrl?: string
  twitterUrl?: string
  twitchUrl?: string
  profileImage: File | null
  bannerImage: File | null
  activityProof: File[]
  agreesToTerms: boolean
}

export interface GachaCreationFormData {
  title: string
  description: string
  price: number
  startDate: string
  endDate: string
  thumbnailImage: File | null
  items: GachaItemFormData[]
}

export interface GachaItemFormData {
  name: string
  description: string
  rarity: GachaItem['rarity']
  dropRate: number
  image: File | null
  category: string
}

// Validation error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

// API response types
export interface VTuberAPIResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: ValidationError[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

export type VTuberSortOption = 'created_at' | 'revenue' | 'fan_count' | 'name'

export interface VTuberFilters {
  status?: VTuberInfo['status']
  dateRange?: DateRange
  minRevenue?: number
  maxRevenue?: number
  minFanCount?: number
  maxFanCount?: number
}