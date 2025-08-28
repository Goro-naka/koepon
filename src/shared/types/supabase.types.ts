// Generated types for Supabase integration
// This file will be auto-generated from the Supabase schema

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // User Management
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          username: string;
          display_name: string;
          role: 'FAN' | 'VTUBER' | 'ADMIN';
          is_email_verified: boolean;
          profile_image_url: string | null;
          last_login_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          username: string;
          display_name: string;
          role?: 'FAN' | 'VTUBER' | 'ADMIN';
          is_email_verified?: boolean;
          profile_image_url?: string | null;
          last_login_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          username?: string;
          display_name?: string;
          role?: 'FAN' | 'VTUBER' | 'ADMIN';
          is_email_verified?: boolean;
          profile_image_url?: string | null;
          last_login_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // VTuber Management
      vtubers: {
        Row: {
          id: string;
          user_id: string;
          channel_name: string;
          channel_url: string | null;
          description: string | null;
          profile_image_url: string | null;
          banner_image_url: string | null;
          status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
          verified_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_name: string;
          channel_url?: string | null;
          description?: string | null;
          profile_image_url?: string | null;
          banner_image_url?: string | null;
          status?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_name?: string;
          channel_url?: string | null;
          description?: string | null;
          profile_image_url?: string | null;
          banner_image_url?: string | null;
          status?: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
          verified_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Gacha System
      gachas: {
        Row: {
          id: string;
          vtuber_id: string;
          name: string;
          description: string | null;
          thumbnail_url: string | null;
          single_price: number;
          ten_pull_price: number;
          medal_per_pull: number;
          status: 'DRAFT' | 'PUBLISHED' | 'ENDED' | 'SUSPENDED';
          start_at: string;
          end_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vtuber_id: string;
          name: string;
          description?: string | null;
          thumbnail_url?: string | null;
          single_price: number;
          ten_pull_price: number;
          medal_per_pull?: number;
          status?: 'DRAFT' | 'PUBLISHED' | 'ENDED' | 'SUSPENDED';
          start_at: string;
          end_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vtuber_id?: string;
          name?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          single_price?: number;
          ten_pull_price?: number;
          medal_per_pull?: number;
          status?: 'DRAFT' | 'PUBLISHED' | 'ENDED' | 'SUSPENDED';
          start_at?: string;
          end_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Oshi Medal System
      oshi_medals: {
        Row: {
          id: string;
          user_id: string;
          vtuber_id: string;
          balance: number;
          total_earned: number;
          total_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vtuber_id: string;
          balance?: number;
          total_earned?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vtuber_id?: string;
          balance?: number;
          total_earned?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Sessions for refresh tokens
      sessions: {
        Row: {
          id: string;
          user_id: string;
          refresh_token: string;
          expires_at: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          refresh_token: string;
          expires_at: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          refresh_token?: string;
          expires_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'FAN' | 'VTUBER' | 'ADMIN';
      vtuber_status: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED';
      gacha_status: 'DRAFT' | 'PUBLISHED' | 'ENDED' | 'SUSPENDED';
      payment_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
      file_type: 'ZIP' | 'MP3' | 'PNG' | 'JPEG' | 'WEBP' | 'MP4';
      reward_type: 'VOICE' | 'IMAGE' | 'VIDEO' | 'BUNDLE';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}