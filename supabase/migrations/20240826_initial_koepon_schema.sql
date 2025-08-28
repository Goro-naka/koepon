-- Koepon Initial Database Schema
-- Generated: 2024-08-26

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  birth_date DATE,
  is_minor BOOLEAN DEFAULT FALSE,
  parental_consent_given BOOLEAN DEFAULT FALSE,
  consent_received_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VTubers table
CREATE TABLE public.vtubers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  subscriber_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gacha types/campaigns
CREATE TABLE public.gacha_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  vtuber_id UUID REFERENCES public.vtubers(id) ON DELETE CASCADE,
  cost_points INTEGER NOT NULL DEFAULT 100, -- Cost in points per pull
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gacha items/medals
CREATE TABLE public.gacha_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES public.gacha_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity VARCHAR(10) NOT NULL CHECK (rarity IN ('N', 'R', 'SR', 'SSR')),
  drop_rate DECIMAL(5,2) NOT NULL, -- Percentage (0.01 = 0.01%)
  estimated_value INTEGER DEFAULT 0, -- Value in yen for legal compliance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User points (virtual currency)
CREATE TABLE public.user_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Points transaction history
CREATE TABLE public.point_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund', 'admin_adjust')),
  amount INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- Reference to purchase, gacha pull, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User gacha pulls history
CREATE TABLE public.gacha_pulls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.gacha_campaigns(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.gacha_items(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  pull_result JSONB, -- Store detailed pull information
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User inventory (owned medals/items)
CREATE TABLE public.user_inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.gacha_items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Age restrictions table
CREATE TABLE public.user_age_restrictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  monthly_spending_limit INTEGER NOT NULL,
  daily_spending_limit INTEGER NOT NULL,
  time_restrictions JSONB, -- Store time restriction rules
  required_breaks JSONB, -- Store break requirement rules
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Spending history for age restriction compliance
CREATE TABLE public.user_spending_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions for continuous usage tracking
CREATE TABLE public.user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parental consent tokens
CREATE TABLE public.parental_consent_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  child_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  child_name VARCHAR(100) NOT NULL,
  child_age INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health check table
CREATE TABLE public.health_check (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  status VARCHAR(50) DEFAULT 'healthy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial health check record
INSERT INTO public.health_check (status) VALUES ('healthy');

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_vtubers_user_id ON public.vtubers(user_id);
CREATE INDEX idx_vtubers_is_active ON public.vtubers(is_active);
CREATE INDEX idx_gacha_campaigns_vtuber_id ON public.gacha_campaigns(vtuber_id);
CREATE INDEX idx_gacha_campaigns_active_dates ON public.gacha_campaigns(is_active, start_date, end_date);
CREATE INDEX idx_gacha_items_campaign_id ON public.gacha_items(campaign_id);
CREATE INDEX idx_gacha_items_rarity ON public.gacha_items(rarity);
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX idx_point_transactions_type ON public.point_transactions(transaction_type);
CREATE INDEX idx_gacha_pulls_user_id ON public.gacha_pulls(user_id);
CREATE INDEX idx_gacha_pulls_campaign_id ON public.gacha_pulls(campaign_id);
CREATE INDEX idx_user_inventory_user_id ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_item_id ON public.user_inventory(item_id);
CREATE INDEX idx_user_age_restrictions_user_id ON public.user_age_restrictions(user_id);
CREATE INDEX idx_user_spending_history_user_id ON public.user_spending_history(user_id);
CREATE INDEX idx_user_spending_history_date ON public.user_spending_history(transaction_date);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX idx_parental_consent_tokens_token ON public.parental_consent_tokens(token);
CREATE INDEX idx_parental_consent_tokens_child_user_id ON public.parental_consent_tokens(child_user_id);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vtubers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_pulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_age_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spending_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parental_consent_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable" ON public.users
  FOR SELECT USING (is_active = true);

-- VTubers policies
CREATE POLICY "Anyone can read active VTubers" ON public.vtubers
  FOR SELECT USING (is_active = true);

CREATE POLICY "VTubers can update own profile" ON public.vtubers
  FOR UPDATE USING (auth.uid() = user_id);

-- Gacha campaigns policies
CREATE POLICY "Anyone can read active campaigns" ON public.gacha_campaigns
  FOR SELECT USING (is_active = true AND start_date <= NOW() AND end_date >= NOW());

-- Gacha items policies
CREATE POLICY "Anyone can read gacha items" ON public.gacha_items
  FOR SELECT USING (true);

-- User points policies
CREATE POLICY "Users can read own points" ON public.user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON public.user_points
  FOR UPDATE USING (auth.uid() = user_id);

-- Point transactions policies
CREATE POLICY "Users can read own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Gacha pulls policies
CREATE POLICY "Users can read own pulls" ON public.gacha_pulls
  FOR SELECT USING (auth.uid() = user_id);

-- User inventory policies
CREATE POLICY "Users can read own inventory" ON public.user_inventory
  FOR SELECT USING (auth.uid() = user_id);

-- Age restrictions policies
CREATE POLICY "Users can read own restrictions" ON public.user_age_restrictions
  FOR SELECT USING (auth.uid() = user_id);

-- Spending history policies
CREATE POLICY "Users can read own spending history" ON public.user_spending_history
  FOR SELECT USING (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can read own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Health check policy (public read)
CREATE POLICY "Public health check" ON public.health_check
  FOR SELECT USING (true);

-- Functions for business logic

-- Function to create staging test data
CREATE OR REPLACE FUNCTION create_staging_test_data()
RETURNS void AS $$
BEGIN
  -- Create test users (if not exists)
  INSERT INTO public.users (id, username, display_name, email, birth_date, is_minor, is_active)
  VALUES 
    ('00000000-0000-0000-0000-000000000001', 'staging-admin', 'Staging Admin', 'staging-admin@example.com', '1990-01-01', false, true),
    ('00000000-0000-0000-0000-000000000002', 'staging-vtuber', 'Staging VTuber', 'staging-vtuber@example.com', '1995-06-15', false, true),
    ('00000000-0000-0000-0000-000000000003', 'staging-user', 'Staging User', 'staging-user@example.com', '2000-12-25', false, true),
    ('00000000-0000-0000-0000-000000000004', 'staging-minor', 'Staging Minor', 'staging-minor@example.com', '2010-03-10', true, true)
  ON CONFLICT (id) DO NOTHING;

  -- Create test VTuber
  INSERT INTO public.vtubers (id, user_id, channel_name, description, subscriber_count, is_verified, is_active)
  VALUES (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Staging VTuber Channel',
    'Test VTuber for staging environment',
    1000,
    true,
    true
  ) ON CONFLICT DO NOTHING;

  -- Create test gacha campaign
  INSERT INTO public.gacha_campaigns (id, name, description, vtuber_id, cost_points, start_date, end_date, is_active)
  VALUES (
    '20000000-0000-0000-0000-000000000001',
    'Test Gacha Campaign',
    'Staging environment test gacha',
    '10000000-0000-0000-0000-000000000001',
    100,
    '2024-01-01 00:00:00+00',
    '2024-12-31 23:59:59+00',
    true
  ) ON CONFLICT DO NOTHING;

  -- Create test gacha items
  INSERT INTO public.gacha_items (campaign_id, name, description, rarity, drop_rate, estimated_value)
  VALUES 
    ('20000000-0000-0000-0000-000000000001', 'Common Medal', 'Common test medal', 'N', 50.0, 5),
    ('20000000-0000-0000-0000-000000000001', 'Rare Medal', 'Rare test medal', 'R', 35.0, 20),
    ('20000000-0000-0000-0000-000000000001', 'Super Rare Medal', 'SR test medal', 'SR', 12.0, 100),
    ('20000000-0000-0000-0000-000000000001', 'Super Super Rare Medal', 'SSR test medal', 'SSR', 3.0, 500)
  ON CONFLICT DO NOTHING;

  -- Create test user points
  INSERT INTO public.user_points (user_id, balance, total_purchased)
  VALUES 
    ('00000000-0000-0000-0000-000000000001', 10000, 10000),
    ('00000000-0000-0000-0000-000000000002', 5000, 5000),
    ('00000000-0000-0000-0000-000000000003', 1000, 1000),
    ('00000000-0000-0000-0000-000000000004', 500, 500)
  ON CONFLICT (user_id) DO UPDATE SET 
    balance = EXCLUDED.balance,
    total_purchased = EXCLUDED.total_purchased;

  -- Create age restrictions for minor user
  INSERT INTO public.user_age_restrictions (user_id, monthly_spending_limit, daily_spending_limit, time_restrictions, required_breaks)
  VALUES (
    '00000000-0000-0000-0000-000000000004',
    5000,
    1000,
    '{"weekdays": {"start": "06:00", "end": "22:00"}, "weekends": {"start": "06:00", "end": "23:00"}}',
    '{"continuous": 60, "daily": 180}'
  ) ON CONFLICT (user_id) DO UPDATE SET 
    monthly_spending_limit = EXCLUDED.monthly_spending_limit,
    daily_spending_limit = EXCLUDED.daily_spending_limit,
    time_restrictions = EXCLUDED.time_restrictions,
    required_breaks = EXCLUDED.required_breaks;

  RAISE NOTICE 'Staging test data created successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to get database statistics
CREATE OR REPLACE FUNCTION get_db_stats()
RETURNS TABLE(
  table_name text,
  row_count bigint,
  connections integer,
  memory_usage text,
  disk_usage text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    (
      SELECT COUNT(*) 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) as row_count,
    (SELECT COUNT(*) FROM pg_stat_activity)::integer as connections,
    '0 MB'::text as memory_usage, -- Placeholder
    '0 GB'::text as disk_usage    -- Placeholder
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;