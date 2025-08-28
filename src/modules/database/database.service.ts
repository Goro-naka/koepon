import { Injectable, Logger } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from '../../shared/types/supabase.types';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly supabase: SupabaseClient<Database>;
  private readonly adminClient: SupabaseClient<Database>;

  constructor() {
    // Direct Supabase client creation
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }

    // User client
    this.supabase = createClient<Database>(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'X-Client-Info': 'koepon-api/1.0.0',
        },
      },
    });

    // Admin client
    this.adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
  }

  /**
   * Get the main Supabase client (for user operations)
   */
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Get the admin Supabase client (for server-side operations)
   */
  getAdminClient(): SupabaseClient<Database> {
    return this.adminClient;
  }

  /**
   * Check database connection and health
   */
  async checkHealth(): Promise<{ status: string; timestamp: string; details?: unknown }> {
    try {
      // Test basic connectivity
      const { error } = await this.supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (error) {
        this.logger.error('Database health check failed:', error);
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: error.message },
        };
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: { connection: 'ok' },
      };
    } catch (error) {
      this.logger.error('Database health check exception:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Execute raw SQL (admin only) - Note: Custom function needs to be created in Supabase
   */
  async executeRawSQL(): Promise<unknown> {
    try {
      // For now, we'll use direct table operations
      // Custom RPC functions can be added later in Supabase
      this.logger.warn('Direct SQL execution not implemented yet. Use table operations instead.');
      throw new Error('Direct SQL execution requires custom Supabase function setup');
    } catch (error) {
      this.logger.error('Raw SQL execution exception:', error);
      throw error;
    }
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<Record<string, number>> {
    try {
      const tables = ['users', 'vtubers', 'gachas', 'gacha_items', 'oshi_medals'];
      const stats: Record<string, number> = {};

      for (const table of tables) {
        const { count, error } = await this.adminClient
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          this.logger.warn(`Failed to get stats for table ${table}:`, error);
          stats[table] = -1;
        } else {
          stats[table] = count ?? 0;
        }
      }

      return stats;
    } catch (error) {
      this.logger.error('Failed to get table statistics:', error);
      throw error;
    }
  }

  // Authentication related methods

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        this.logger.error('Error fetching user by email:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in getUserByEmail:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<any | null> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        this.logger.error('Error fetching user by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Exception in getUserById:', error);
      throw error;
    }
  }

  /**
   * Create session
   */
  async createSession(userId: string, refreshToken: string): Promise<{ id: string; refreshToken: string }> {
    try {
      const sessionData = {
        user_id: userId,
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { data, error } = await this.adminClient
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        this.logger.error('Error creating session:', error);
        throw error;
      }

      return {
        id: data.id,
        refreshToken: data.refresh_token,
      };
    } catch (error) {
      this.logger.error('Exception in createSession:', error);
      throw error;
    }
  }

  /**
   * Get session by refresh token
   */
  async getSessionByRefreshToken(refreshToken: string): Promise<any | null> {
    try {
      const { data, error } = await this.adminClient
        .from('sessions')
        .select('*')
        .eq('refresh_token', refreshToken)
        .maybeSingle();

      if (error) {
        this.logger.error('Error fetching session by refresh token:', error);
        throw error;
      }

      return data ? {
        id: data.id,
        userId: data.user_id,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
      } : null;
    } catch (error) {
      this.logger.error('Exception in getSessionByRefreshToken:', error);
      throw error;
    }
  }

  /**
   * Update session expiry
   */
  async updateSessionExpiry(sessionId: string): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('sessions')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          updated_at: new Date(),
        })
        .eq('id', sessionId);

      if (error) {
        this.logger.error('Error updating session expiry:', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('Exception in updateSessionExpiry:', error);
      throw error;
    }
  }

  /**
   * Remove session
   */
  async removeSession(sessionId: string): Promise<void> {
    try {
      const { error } = await this.adminClient
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        this.logger.error('Error removing session:', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('Exception in removeSession:', error);
      throw error;
    }
  }
}