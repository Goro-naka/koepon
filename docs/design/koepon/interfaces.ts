// ========================================
// 基本型定義
// ========================================

export type UUID = string;
export type ISODateString = string;
export type URL = string;
export type Email = string;
export type HashedPassword = string;

// ========================================
// Enum定義
// ========================================

export enum UserRole {
  FAN = 'FAN',
  VTUBER = 'VTUBER',
  ADMIN = 'ADMIN',
}

export enum GachaStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ENDED = 'ENDED',
  SUSPENDED = 'SUSPENDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  KOMOJU = 'KOMOJU',
}

export enum FileType {
  ZIP = 'ZIP',
  MP3 = 'MP3',
  PNG = 'PNG',
  JPEG = 'JPEG',
  WEBP = 'WEBP',
  MP4 = 'MP4',
}

export enum RewardType {
  VOICE = 'VOICE',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  BUNDLE = 'BUNDLE',
}

export enum VTuberStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

// ========================================
// エンティティ定義
// ========================================

export interface User {
  id: UUID;
  email: Email;
  passwordHash: HashedPassword;
  username: string;
  displayName: string;
  role: UserRole;
  isEmailVerified: boolean;
  profileImageUrl?: URL;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastLoginAt?: ISODateString;
  deletedAt?: ISODateString;
}

export interface VTuber {
  id: UUID;
  userId: UUID;
  channelName: string;
  channelUrl?: URL;
  description?: string;
  profileImageUrl?: URL;
  bannerImageUrl?: URL;
  status: VTuberStatus;
  verifiedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Gacha {
  id: UUID;
  vtuberId: UUID;
  name: string;
  description: string;
  thumbnailUrl?: URL;
  singlePrice: number; // JPY
  tenPullPrice: number; // JPY
  medalPerPull: number;
  status: GachaStatus;
  startAt: ISODateString;
  endAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface GachaItem {
  id: UUID;
  gachaId: UUID;
  name: string;
  description?: string;
  rarity: number; // 1-5
  dropRate: number; // 0.01 - 100 (%)
  thumbnailUrl?: URL;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface GachaReward {
  id: UUID;
  gachaItemId: UUID;
  name: string;
  description?: string;
  type: RewardType;
  fileUrl: URL;
  fileSize: number; // bytes
  fileType: FileType;
  createdAt: ISODateString;
}

export interface Payment {
  id: UUID;
  userId: UUID;
  gachaId: UUID;
  provider: PaymentProvider;
  providerPaymentId: string;
  amount: number; // JPY
  status: PaymentStatus;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  completedAt?: ISODateString;
  failedAt?: ISODateString;
  refundedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface GachaPull {
  id: UUID;
  userId: UUID;
  gachaId: UUID;
  paymentId: UUID;
  pullCount: number; // 1 or 10
  results: GachaPullResult[];
  createdAt: ISODateString;
}

export interface GachaPullResult {
  id: UUID;
  gachaPullId: UUID;
  gachaItemId: UUID;
  position: number; // 1-10
  createdAt: ISODateString;
}

export interface OshiMedal {
  id: UUID;
  userId: UUID;
  vtuberId: UUID;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: ISODateString;
  createdAt: ISODateString;
}

export interface OshiMedalTransaction {
  id: UUID;
  userId: UUID;
  vtuberId: UUID;
  oshiMedalId: UUID;
  type: 'EARNED' | 'SPENT';
  amount: number;
  balance: number;
  reason: string;
  referenceType?: 'GACHA_PULL' | 'EXCHANGE';
  referenceId?: UUID;
  createdAt: ISODateString;
}

export interface ExchangeItem {
  id: UUID;
  vtuberId: UUID;
  name: string;
  description?: string;
  thumbnailUrl?: URL;
  requiredMedals: number;
  maxExchangeCount?: number; // null = unlimited
  availableFrom: ISODateString;
  availableTo: ISODateString;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ExchangeReward {
  id: UUID;
  exchangeItemId: UUID;
  name: string;
  type: RewardType;
  fileUrl: URL;
  fileSize: number;
  fileType: FileType;
  createdAt: ISODateString;
}

export interface ExchangeHistory {
  id: UUID;
  userId: UUID;
  exchangeItemId: UUID;
  medalCost: number;
  createdAt: ISODateString;
}

export interface UserReward {
  id: UUID;
  userId: UUID;
  rewardType: 'GACHA' | 'EXCHANGE';
  rewardId: UUID; // GachaReward.id or ExchangeReward.id
  name: string;
  fileUrl: URL;
  downloadCount: number;
  lastDownloadedAt?: ISODateString;
  createdAt: ISODateString;
}

export interface AuditLog {
  id: UUID;
  userId?: UUID;
  action: string;
  entityType: string;
  entityId: UUID;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: ISODateString;
}

// ========================================
// APIリクエスト/レスポンス型定義
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 認証関連
export interface LoginRequest {
  email: Email;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  email: Email;
  password: string;
  username: string;
  displayName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ガチャ関連
export interface CreateGachaRequest {
  name: string;
  description: string;
  thumbnailUrl?: URL;
  singlePrice: number;
  tenPullPrice: number;
  medalPerPull: number;
  startAt: ISODateString;
  endAt: ISODateString;
  items: CreateGachaItemRequest[];
}

export interface CreateGachaItemRequest {
  name: string;
  description?: string;
  rarity: number;
  dropRate: number;
  thumbnailUrl?: URL;
  rewards: CreateGachaRewardRequest[];
}

export interface CreateGachaRewardRequest {
  name: string;
  description?: string;
  type: RewardType;
  fileId: UUID; // 事前にアップロードされたファイルのID
}

export interface PurchaseGachaRequest {
  gachaId: UUID;
  pullCount: 1 | 10;
  paymentMethodId?: string; // Stripe Payment Method ID
}

export interface PurchaseGachaResponse {
  paymentId: UUID;
  pullId: UUID;
  results: GachaPullResultDetail[];
  medalEarned: number;
  newMedalBalance: number;
}

export interface GachaPullResultDetail {
  position: number;
  item: GachaItem;
  rewards: GachaReward[];
}

// 交換所関連
export interface CreateExchangeItemRequest {
  name: string;
  description?: string;
  thumbnailUrl?: URL;
  requiredMedals: number;
  maxExchangeCount?: number;
  availableFrom: ISODateString;
  availableTo: ISODateString;
  rewards: CreateExchangeRewardRequest[];
}

export interface CreateExchangeRewardRequest {
  name: string;
  type: RewardType;
  fileId: UUID;
}

export interface ExchangeRequest {
  exchangeItemId: UUID;
  quantity?: number; // default: 1
}

export interface ExchangeResponse {
  exchangeHistoryId: UUID;
  medalCost: number;
  newMedalBalance: number;
  rewards: ExchangeReward[];
}

// 特典関連
export interface GenerateDownloadUrlRequest {
  rewardId: UUID;
}

export interface GenerateDownloadUrlResponse {
  downloadUrl: URL;
  expiresAt: ISODateString;
  fileName: string;
  fileSize: number;
}

// ファイルアップロード関連
export interface InitiateUploadRequest {
  fileName: string;
  fileSize: number;
  fileType: FileType;
  contentType: string;
}

export interface InitiateUploadResponse {
  uploadId: UUID;
  uploadUrl: URL;
  expiresAt: ISODateString;
}

export interface CompleteUploadRequest {
  uploadId: UUID;
}

export interface CompleteUploadResponse {
  fileId: UUID;
  fileUrl: URL;
  thumbnailUrl?: URL;
}

// VTuber管理関連
export interface UpdateVTuberProfileRequest {
  channelName?: string;
  channelUrl?: URL;
  description?: string;
  profileImageUrl?: URL;
  bannerImageUrl?: URL;
}

export interface VTuberDashboardStats {
  totalRevenue: number;
  totalPulls: number;
  totalUsers: number;
  activeMedals: number;
  topItems: {
    item: GachaItem;
    pullCount: number;
  }[];
  revenueHistory: {
    date: string;
    revenue: number;
  }[];
}

// 管理者関連
export interface AdminDashboardStats {
  totalUsers: number;
  totalVTubers: number;
  totalGachas: number;
  totalRevenue: number;
  dailyActiveUsers: number;
  pendingVTuberApprovals: number;
}

export interface ApproveVTuberRequest {
  vtuberId: UUID;
  notes?: string;
}

export interface RejectVTuberRequest {
  vtuberId: UUID;
  reason: string;
}

// WebSocket イベント型定義
export interface WebSocketEvent<T = any> {
  type: string;
  payload: T;
  timestamp: ISODateString;
}

export interface GachaPullStartEvent {
  type: 'GACHA_PULL_START';
  payload: {
    pullId: UUID;
    pullCount: number;
  };
}

export interface GachaPullResultEvent {
  type: 'GACHA_PULL_RESULT';
  payload: {
    pullId: UUID;
    position: number;
    item: GachaItem;
    rewards: GachaReward[];
  };
}

export interface GachaPullCompleteEvent {
  type: 'GACHA_PULL_COMPLETE';
  payload: {
    pullId: UUID;
    medalEarned: number;
    newMedalBalance: number;
  };
}

// ========================================
// ユーティリティ型定義
// ========================================

export type WithTimestamps<T> = T & {
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type WithSoftDelete<T> = T & {
  deletedAt?: ISODateString;
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// ========================================
// バリデーション用の型ガード
// ========================================

export const isValidEmail = (email: string): email is Email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUUID = (uuid: string): uuid is UUID => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidFileType = (type: string): type is FileType => {
  return Object.values(FileType).includes(type as FileType);
};

export const isValidDropRate = (rate: number): boolean => {
  return rate >= 0.01 && rate <= 100;
};

export const isValidPrice = (price: number): boolean => {
  return price > 0 && Number.isInteger(price);
};