export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  idempotencyKey: string;
  amount: number;
  gachaId: string;
  gachaCount: number;
  status: PaymentStatus;
  currency: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  userId: string;
  stripeRefundId?: string;
  amount: number;
  medalAmount?: number;
  status: RefundStatus;
  reason: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
}

export interface Gacha {
  id: string;
  name: string;
  description?: string;
  vtuberId: string;
  singlePrice: number;
  tenPullPrice?: number;
  currency: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  gachaCount: number;
  confirmedAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  createdAt: Date;
}

export interface CreatePaymentIntentRequest {
  gachaId: string;
  gachaType: 'single' | 'ten_pull';
  paymentMethod?: string;
  returnUrl?: string;
}

export interface CreatePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  gachaCount: number;
  idempotencyKey: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
  idempotencyKey: string;
}

export interface RefundRequestRequest {
  paymentId: string;
  reason: string;
  amount?: number;
}

export interface RefundRequestResponse {
  refundId: string;
  status: RefundStatus;
  estimatedProcessingTime: string;
}

export interface PaymentHistoryQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  from?: string;
  to?: string;
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}