import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

export interface DashboardStats {
  systemOverview: {
    totalUsers: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    totalVTubers: number;
    pendingApplications: number;
    approvalRate: number;
    totalRevenue: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    activeUsersDAU: number;
    activeUsersMAU: number;
    systemAlerts: Array<{
      id: string;
      level: 'info' | 'warning' | 'error';
      message: string;
      timestamp: string;
      acknowledged: boolean;
      source: string;
    }>;
  };
  systemStatus: {
    apiResponseTime: number;
    errorRate: number;
    databaseStatus: 'healthy' | 'degraded' | 'down';
    cacheHitRate: number;
    storageUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

@Injectable()
export class AdminSupabaseService {
  constructor(private supabaseService: SupabaseService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = this.supabaseService.getClient();

    try {
      // Get user statistics
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get VTuber statistics
      const { count: totalVTubers } = await supabase
        .from('vtubers')
        .select('*', { count: 'exact', head: true });

      // Get pending applications
      const { count: pendingApplications } = await supabase
        .from('vtubers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      return {
        systemOverview: {
          totalUsers: totalUsers || 0,
          newUsersToday: 0, // TODO: Implement with proper date filtering
          newUsersThisMonth: 0, // TODO: Implement with proper date filtering
          totalVTubers: totalVTubers || 0,
          pendingApplications: pendingApplications || 0,
          approvalRate: (pendingApplications ?? 0) > 0 ? (((totalVTubers ?? 0) - (pendingApplications ?? 0)) / (totalVTubers ?? 1) * 100) : 100,
          totalRevenue: 0, // TODO: Implement with payment data
          monthlyRevenue: 0, // TODO: Implement with payment data
          revenueGrowth: 0, // TODO: Implement with payment data
          activeUsersDAU: 0, // TODO: Implement with user activity tracking
          activeUsersMAU: 0, // TODO: Implement with user activity tracking
          systemAlerts: [], // TODO: Implement system monitoring
        },
        systemStatus: {
          apiResponseTime: Math.floor(Math.random() * 200) + 50,
          errorRate: Math.random() * 0.1,
          databaseStatus: 'healthy',
          cacheHitRate: Math.random() * 5 + 90,
          storageUsage: {
            used: Math.floor(Math.random() * 500000000),
            total: 1000000000,
            percentage: Math.random() * 50,
          },
        },
        dateRange: {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: now.toISOString().split('T')[0],
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getUsers() {
    const supabase = this.supabaseService.getClient();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          created_at,
          updated_at,
          status,
          medal_balance
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Transform Supabase data to expected format
      return data.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.display_name || 'Unknown User',
        registrationDate: user.created_at,
        lastLoginDate: user.updated_at,
        status: user.status || 'active',
        totalGachaDraws: 0, // TODO: Implement with gacha history
        totalSpent: 0, // TODO: Implement with payment history
        medalBalance: user.medal_balance || 0,
        rewardCount: 0, // TODO: Implement with reward history
        riskScore: 0.1, // TODO: Implement risk assessment
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

}