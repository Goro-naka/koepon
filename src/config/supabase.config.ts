import { Injectable } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { Database } from '../shared/types/supabase.types';

@Injectable()
export class SupabaseConfigService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side: don't persist sessions
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
  }

  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  // Admin client for server-side operations
  getAdminClient(): SupabaseClient<Database> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase admin configuration is missing.');
    }

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
  }
}