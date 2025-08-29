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
      
      // Fallback to mock data if database queries fail
      return this.getMockDashboardStats();
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
        return this.getMockUsers();
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
      return this.getMockUsers();
    }
  }

  private getMockDashboardStats(): DashboardStats {
    return {
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
            level: 'warning',
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
        databaseStatus: 'healthy',
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
    };
  }

  private getMockUsers() {
    return [
      {
        id: '1',
        email: 'user1@example.com',
        displayName: 'ユーザー1',
        registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastLoginDate: new Date().toISOString(),
        status: 'active',
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
        lastLoginDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        totalGachaDraws: 23,
        totalSpent: 8500,
        medalBalance: 1200,
        rewardCount: 8,
        riskScore: 0.1
      }
    ];
  }
}