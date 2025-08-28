export enum PushMedalTransactionType {
  GACHA_REWARD = 'GACHA_REWARD',
  SPECIAL_BONUS = 'SPECIAL_BONUS',
  EXCHANGE_CONSUMPTION = 'EXCHANGE_CONSUMPTION',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  TRANSFER_FROM_POOL = 'TRANSFER_FROM_POOL',
  REFUND_ADJUSTMENT = 'REFUND_ADJUSTMENT'
}

export interface PushMedalBalance {
  id: string;
  userId: string;
  vtuberId?: string; // null for pool balance
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushMedalTransaction {
  id: string;
  userId: string;
  vtuberId?: string;
  transactionType: PushMedalTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string; // gacha_id, payment_id, etc.
  referenceType?: string; // 'gacha', 'payment', 'transfer'
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface GachaExecutedEvent {
  userId: string;
  gachaId: string;
  vtuberId: string;
  executionCount: number;
  totalCost: number;
  timestamp: string;
}

export interface PaymentCompletedEvent {
  userId: string;
  paymentId: string;
  gachaId: string;
  gachaCount: number;
  amount: number;
}

export interface PushMedalBalanceQuery {
  userId: string;
  vtuberId?: string;
}

export interface PushMedalBalanceResponse {
  userId: string;
  vtuberId?: string;
  balance: number;
  lastUpdated: Date;
}

export interface PushMedalPoolBalanceResponse {
  userId: string;
  totalPoolBalance: number;
  vtuberBalances: Array<{
    vtuberId: string;
    balance: number;
  }>;
}

export interface PushMedalTransactionHistoryQuery {
  userId: string;
  vtuberId?: string;
  transactionType?: PushMedalTransactionType;
  limit?: number;
  offset?: number;
  from?: Date;
  to?: Date;
}

export interface PushMedalTransactionHistoryResponse {
  transactions: PushMedalTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface TransferFromPoolRequest {
  userId: string;
  fromVtuberId?: string; // null for pool
  toVtuberId: string;
  amount: number;
}

export interface AdminAdjustBalanceRequest {
  userId: string;
  vtuberId?: string;
  amount: number;
  reason: string;
  adminId: string;
}

export interface IntegrityCheckResult {
  userId: string;
  vtuberId?: string;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  isValid: boolean;
  lastTransactionDate?: Date;
}

export interface IntegrityCheckReport {
  totalChecked: number;
  validBalances: number;
  invalidBalances: number;
  discrepancies: IntegrityCheckResult[];
  checkedAt: Date;
}