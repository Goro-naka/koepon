import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminSupabaseService } from './admin-supabase.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseService, AdminSupabaseService],
  exports: [AdminSupabaseService],
})
export class AdminSupabaseModule {}