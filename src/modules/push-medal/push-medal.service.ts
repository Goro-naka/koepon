import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import {
  AdminAdjustBalanceRequest,
  GachaExecutedEvent,
  IntegrityCheckReport,
  IntegrityCheckResult,
  PaymentCompletedEvent,
  PushMedalBalance,
  PushMedalBalanceResponse,
  PushMedalPoolBalanceResponse,
  PushMedalTransaction,
  PushMedalTransactionHistoryQuery,
  PushMedalTransactionHistoryResponse,
  PushMedalTransactionType,
  TransferFromPoolRequest
} from './interfaces/push-medal.interface';
import {
  InsufficientPushMedalBalanceException,
  InvalidPushMedalAmountException,
  PushMedalBalanceNotFoundException,
  PushMedalTransactionFailedException,
  VTuberNotFoundException
} from './exceptions/push-medal.exceptions';

@Injectable()
export class PushMedalService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: CustomLoggerService
  ) {}

  async grantMedalFromGacha(event: GachaExecutedEvent): Promise<PushMedalTransaction> {
    try {
      // Calculate medal amount based on gacha cost and execution count
      const medalAmount = this.calculateMedalAmount(event.totalCost, event.executionCount);
      
      this.logger.log(
        `Granting ${medalAmount} push medals for gacha ${event.gachaId} to user ${event.userId}`,
        'PushMedalService'
      );
      
      // Update user's push medal balance for this VTuber
      const transaction = await this.updateBalance(
        event.userId,
        event.vtuberId,
        medalAmount,
        PushMedalTransactionType.GACHA_REWARD,
        event.gachaId,
        'gacha',
        {
          executionCount: event.executionCount,
          totalCost: event.totalCost,
          timestamp: event.timestamp
        }
      );
      
      return transaction;
    } catch (error) {
      this.logger.error(
        `Failed to grant medals from gacha: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async grantMedalFromPayment(event: PaymentCompletedEvent): Promise<PushMedalTransaction> {
    try {
      // Calculate medal amount based on payment amount and gacha count
      const medalAmount = this.calculateMedalAmount(event.amount, event.gachaCount);
      
      this.logger.log(
        `Granting ${medalAmount} push medals from payment ${event.paymentId} to user ${event.userId}`,
        'PushMedalService'
      );
      
      // For payment events, we need to get the VTuber from the gacha
      const adminClient = this.databaseService.getAdminClient();
      const { data: gacha } = await adminClient
        .from('gachas')
        .select('vtuber_id')
        .eq('id', event.gachaId)
        .single();
      
      if (!gacha) {
        throw new Error(`Gacha ${event.gachaId} not found`);
      }
      
      // Update user's push medal balance for this VTuber
      const transaction = await this.updateBalance(
        event.userId,
        gacha.vtuber_id,
        medalAmount,
        PushMedalTransactionType.GACHA_REWARD,
        event.paymentId,
        'payment',
        {
          gachaId: event.gachaId,
          gachaCount: event.gachaCount,
          amount: event.amount
        }
      );
      
      return transaction;
    } catch (error) {
      this.logger.error(
        `Failed to grant medals from payment: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async getBalance(userId: string, vtuberId?: string): Promise<PushMedalBalanceResponse> {
    try {
      const balanceRecord = await this.getBalanceRecord(userId, vtuberId);
      
      if (!balanceRecord) {
        // Return zero balance if no record exists
        return {
          userId,
          vtuberId,
          balance: 0,
          lastUpdated: new Date()
        };
      }
      
      return {
        userId: balanceRecord.userId,
        vtuberId: balanceRecord.vtuberId,
        balance: balanceRecord.balance,
        lastUpdated: balanceRecord.updatedAt
      };
    } catch (error) {
      this.logger.error(
        `Failed to get balance for user ${userId}: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async getPoolBalance(userId: string): Promise<PushMedalPoolBalanceResponse> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      // Get all balances for the user
      const { data: balances } = await adminClient
        .from('push_medal_balances')
        .select('vtuber_id, balance')
        .eq('user_id', userId);
      
      if (!balances || balances.length === 0) {
        return {
          userId,
          totalPoolBalance: 0,
          vtuberBalances: []
        };
      }
      
      const poolBalance = balances.find(b => b.vtuber_id === null);
      const vtuberBalances = balances
        .filter(b => b.vtuber_id !== null)
        .map(b => ({
          vtuberId: b.vtuber_id,
          balance: b.balance
        }));
      
      const totalPoolBalance = poolBalance ? poolBalance.balance : 0;
      
      return {
        userId,
        totalPoolBalance,
        vtuberBalances
      };
    } catch (error) {
      this.logger.error(
        `Failed to get pool balance for user ${userId}: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async getTransactionHistory(query: PushMedalTransactionHistoryQuery): Promise<PushMedalTransactionHistoryResponse> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      const limit = query.limit || 20;
      const offset = query.offset || 0;
      
      let queryBuilder = adminClient
        .from('push_medal_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', query.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (query.vtuberId) {
        queryBuilder = queryBuilder.eq('vtuber_id', query.vtuberId);
      }
      
      if (query.transactionType) {
        queryBuilder = queryBuilder.eq('transaction_type', query.transactionType);
      }
      
      if (query.from) {
        queryBuilder = queryBuilder.gte('created_at', query.from.toISOString());
      }
      
      if (query.to) {
        queryBuilder = queryBuilder.lte('created_at', query.to.toISOString());
      }
      
      const { data: transactions, count } = await queryBuilder;
      
      const transactionHistory: PushMedalTransaction[] = (transactions || []).map(t => ({
        id: t.id,
        userId: t.user_id,
        vtuberId: t.vtuber_id,
        transactionType: t.transaction_type as PushMedalTransactionType,
        amount: t.amount,
        balanceBefore: t.balance_before,
        balanceAfter: t.balance_after,
        referenceId: t.reference_id,
        referenceType: t.reference_type,
        metadata: t.metadata,
        createdAt: new Date(t.created_at)
      }));
      
      return {
        transactions: transactionHistory,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      this.logger.error(
        `Failed to get transaction history for user ${query.userId}: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async transferFromPool(request: TransferFromPoolRequest): Promise<PushMedalTransaction[]> {
    try {
      if (request.amount <= 0) {
        throw new InvalidPushMedalAmountException(request.amount);
      }
      
      const fromVtuberId = request.fromVtuberId || null;
      
      // Check if source balance has enough medals
      const sourceBalance = await this.getBalanceRecord(request.userId, fromVtuberId);
      if (!sourceBalance || sourceBalance.balance < request.amount) {
        throw new InsufficientPushMedalBalanceException(
          request.amount,
          sourceBalance ? sourceBalance.balance : 0
        );
      }
      
      // Verify target VTuber exists
      const adminClient = this.databaseService.getAdminClient();
      const { data: vtuber } = await adminClient
        .from('vtubers')
        .select('id')
        .eq('id', request.toVtuberId)
        .single();
      
      if (!vtuber) {
        throw new VTuberNotFoundException(request.toVtuberId);
      }
      
      const transactions: PushMedalTransaction[] = [];
      
      // Deduct from source
      const deductTransaction = await this.updateBalance(
        request.userId,
        fromVtuberId,
        -request.amount,
        PushMedalTransactionType.TRANSFER_FROM_POOL,
        undefined,
        'transfer',
        {
          transferTo: request.toVtuberId,
          transferType: fromVtuberId ? 'vtuber_to_vtuber' : 'pool_to_vtuber'
        }
      );
      transactions.push(deductTransaction);
      
      // Add to target
      const addTransaction = await this.updateBalance(
        request.userId,
        request.toVtuberId,
        request.amount,
        PushMedalTransactionType.TRANSFER_FROM_POOL,
        undefined,
        'transfer',
        {
          transferFrom: fromVtuberId,
          transferType: fromVtuberId ? 'vtuber_to_vtuber' : 'pool_to_vtuber'
        }
      );
      transactions.push(addTransaction);
      
      this.logger.log(
        `Transferred ${request.amount} push medals from ${fromVtuberId || 'pool'} to ${request.toVtuberId} for user ${request.userId}`,
        'PushMedalService'
      );
      
      return transactions;
    } catch (error) {
      this.logger.error(
        `Failed to transfer from pool: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async adminAdjustBalance(request: AdminAdjustBalanceRequest): Promise<PushMedalTransaction> {
    try {
      if (request.amount === 0) {
        throw new InvalidPushMedalAmountException(request.amount);
      }
      
      // If deducting, check if user has enough balance
      if (request.amount < 0) {
        const currentBalance = await this.getBalanceRecord(request.userId, request.vtuberId);
        if (!currentBalance || currentBalance.balance < Math.abs(request.amount)) {
          throw new InsufficientPushMedalBalanceException(
            Math.abs(request.amount),
            currentBalance ? currentBalance.balance : 0
          );
        }
      }
      
      const transaction = await this.updateBalance(
        request.userId,
        request.vtuberId || null,
        request.amount,
        PushMedalTransactionType.ADMIN_ADJUSTMENT,
        request.adminId,
        'admin_adjustment',
        {
          reason: request.reason,
          adminId: request.adminId
        }
      );
      
      this.logger.log(
        `Admin ${request.adminId} adjusted balance by ${request.amount} for user ${request.userId} (VTuber: ${request.vtuberId || 'pool'}): ${request.reason}`,
        'PushMedalService'
      );
      
      return transaction;
    } catch (error) {
      this.logger.error(
        `Failed to adjust balance: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async performIntegrityCheck(userId?: string): Promise<IntegrityCheckReport> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      // Get balances to check
      let balanceQuery = adminClient.from('push_medal_balances').select('*');
      if (userId) {
        balanceQuery = balanceQuery.eq('user_id', userId);
      }
      
      const { data: balances } = await balanceQuery;
      
      if (!balances || balances.length === 0) {
        return {
          totalChecked: 0,
          validBalances: 0,
          invalidBalances: 0,
          discrepancies: [],
          checkedAt: new Date()
        };
      }
      
      const discrepancies: IntegrityCheckResult[] = [];
      let validCount = 0;
      let invalidCount = 0;
      
      for (const balance of balances) {
        // Calculate expected balance from transactions
        const { data: transactions } = await adminClient
          .from('push_medal_transactions')
          .select('amount, created_at')
          .eq('user_id', balance.user_id)
          .eq('vtuber_id', balance.vtuber_id || null)
          .order('created_at', { ascending: true });
        
        const expectedBalance = transactions
          ? transactions.reduce((sum, t) => sum + t.amount, 0)
          : 0;
        
        const discrepancy = balance.balance - expectedBalance;
        const isValid = Math.abs(discrepancy) < 0.01; // Allow for minor floating point errors
        
        if (isValid) {
          validCount++;
        } else {
          invalidCount++;
          
          const lastTransaction = transactions && transactions.length > 0
            ? new Date(transactions[transactions.length - 1].created_at)
            : undefined;
          
          discrepancies.push({
            userId: balance.user_id,
            vtuberId: balance.vtuber_id,
            expectedBalance,
            actualBalance: balance.balance,
            discrepancy,
            isValid: false,
            lastTransactionDate: lastTransaction
          });
        }
      }
      
      const report: IntegrityCheckReport = {
        totalChecked: balances.length,
        validBalances: validCount,
        invalidBalances: invalidCount,
        discrepancies,
        checkedAt: new Date()
      };
      
      this.logger.log(
        `Integrity check completed: ${validCount}/${balances.length} valid balances`,
        'PushMedalService'
      );
      
      if (invalidCount > 0) {
        this.logger.warn(
          `Found ${invalidCount} balance discrepancies`,
          'PushMedalService'
        );
      }
      
      return report;
    } catch (error) {
      this.logger.error(
        `Failed to perform integrity check: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  private calculateMedalAmount(gachaCost: number, gachaCount: number): number {
    // Base calculation: cost / 10 per gacha pull
    // Min 10 medals, max 1000 medals per transaction
    const baseAmount = (gachaCost / 10) * gachaCount;
    return Math.max(10, Math.min(1000, Math.floor(baseAmount)));
  }

  private async updateBalance(
    userId: string,
    vtuberId: string | null,
    amount: number,
    transactionType: PushMedalTransactionType,
    referenceId?: string,
    referenceType?: string,
    metadata?: Record<string, any>
  ): Promise<PushMedalTransaction> {
    if (amount === 0) {
      throw new InvalidPushMedalAmountException(amount);
    }
    
    const adminClient = this.databaseService.getAdminClient();
    
    // Use database function for atomic balance update
    const { data: transactionData, error } = await adminClient
      .rpc('update_push_medal_balance', {
        p_user_id: userId,
        p_vtuber_id: vtuberId,
        p_amount: amount,
        p_transaction_type: transactionType,
        p_reference_id: referenceId || null,
        p_reference_type: referenceType || null,
        p_metadata: metadata || null
      });
    
    if (error) {
      throw new PushMedalTransactionFailedException(error.message);
    }
    
    // Get the created transaction record
    const { data: transaction } = await adminClient
      .from('push_medal_transactions')
      .select('*')
      .eq('id', transactionData)
      .single();
    
    if (!transaction) {
      throw new PushMedalTransactionFailedException('Transaction record not found');
    }
    
    return {
      id: transaction.id,
      userId: transaction.user_id,
      vtuberId: transaction.vtuber_id,
      transactionType: transaction.transaction_type as PushMedalTransactionType,
      amount: transaction.amount,
      balanceBefore: transaction.balance_before,
      balanceAfter: transaction.balance_after,
      referenceId: transaction.reference_id,
      referenceType: transaction.reference_type,
      metadata: transaction.metadata,
      createdAt: new Date(transaction.created_at)
    };
  }

  private async getBalanceRecord(userId: string, vtuberId?: string): Promise<PushMedalBalance | null> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      let query = adminClient
        .from('push_medal_balances')
        .select('*')
        .eq('user_id', userId);
      
      if (vtuberId !== undefined) {
        query = query.eq('vtuber_id', vtuberId);
      } else {
        query = query.is('vtuber_id', null);
      }
      
      const { data: balance } = await query.single();
      
      if (!balance) {
        return null;
      }
      
      return {
        id: balance.id,
        userId: balance.user_id,
        vtuberId: balance.vtuber_id,
        balance: balance.balance,
        createdAt: new Date(balance.created_at),
        updatedAt: new Date(balance.updated_at)
      };
    } catch (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }
  }

  private async createBalanceRecord(userId: string, vtuberId?: string, initialBalance: number = 0): Promise<PushMedalBalance> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: balance, error } = await adminClient
        .from('push_medal_balances')
        .insert({
          user_id: userId,
          vtuber_id: vtuberId || null,
          balance: initialBalance
        })
        .select()
        .single();
      
      if (error) {
        throw new PushMedalTransactionFailedException(`Failed to create balance record: ${error.message}`);
      }
      
      return {
        id: balance.id,
        userId: balance.user_id,
        vtuberId: balance.vtuber_id,
        balance: balance.balance,
        createdAt: new Date(balance.created_at),
        updatedAt: new Date(balance.updated_at)
      };
    } catch (error) {
      this.logger.error(
        `Failed to create balance record for user ${userId}: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }

  async awardMedals(userId: string, vtuberId: string, amount: number): Promise<PushMedalTransaction> {
    try {
      if (amount <= 0) {
        throw new InvalidPushMedalAmountException(amount);
      }

      this.logger.log(
        `Awarding ${amount} push medals to user ${userId} for VTuber ${vtuberId}`,
        'PushMedalService'
      );

      const transaction = await this.updateBalance(
        userId,
        vtuberId,
        amount,
        PushMedalTransactionType.GACHA_REWARD,
        undefined,
        'gacha_reward',
        {
          vtuberId,
          awardedAt: new Date()
        }
      );

      return transaction;
    } catch (error) {
      this.logger.error(
        `Failed to award medals: ${error.message}`,
        error.stack,
        'PushMedalService'
      );
      throw error;
    }
  }
}