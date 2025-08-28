-- Koepon Supabase Compatible Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('FAN', 'VTUBER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vtuber_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gacha_status AS ENUM ('DRAFT', 'PUBLISHED', 'ENDED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE file_type AS ENUM ('ZIP', 'MP3', 'PNG', 'JPEG', 'WEBP', 'MP4');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_type AS ENUM ('VOICE', 'IMAGE', 'VIDEO', 'BUNDLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- User Profiles (extends Supabase auth.users)
-- ========================================

-- User profiles table (complementary to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'FAN',
    profile_image_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Sessions table for refresh tokens
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ========================================
-- VTuber Management
-- ========================================

-- VTubers table
CREATE TABLE IF NOT EXISTS public.vtubers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_name VARCHAR(100) NOT NULL,
    channel_url TEXT,
    description TEXT,
    profile_image_url TEXT,
    banner_image_url TEXT,
    status vtuber_status NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vtubers_user_id ON public.vtubers(user_id);
CREATE INDEX IF NOT EXISTS idx_vtubers_status ON public.vtubers(status);
CREATE INDEX IF NOT EXISTS idx_vtubers_channel_name ON public.vtubers(channel_name);

-- ========================================
-- Gacha System
-- ========================================

-- Gachas table
CREATE TABLE IF NOT EXISTS public.gachas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vtuber_id UUID NOT NULL REFERENCES public.vtubers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    single_price INTEGER NOT NULL CHECK (single_price > 0),
    ten_pull_price INTEGER NOT NULL CHECK (ten_pull_price > 0),
    medal_per_pull INTEGER NOT NULL DEFAULT 1 CHECK (medal_per_pull > 0),
    status gacha_status NOT NULL DEFAULT 'DRAFT',
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_gacha_dates CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_gachas_vtuber_id ON public.gachas(vtuber_id);
CREATE INDEX IF NOT EXISTS idx_gachas_status ON public.gachas(status);
CREATE INDEX IF NOT EXISTS idx_gachas_dates ON public.gachas(start_at, end_at);

-- Gacha Items table
CREATE TABLE IF NOT EXISTS public.gacha_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gacha_id UUID NOT NULL REFERENCES public.gachas(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    rarity INTEGER NOT NULL CHECK (rarity >= 1 AND rarity <= 5),
    drop_rate DECIMAL(5,4) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 1),
    file_url TEXT,
    file_type file_type,
    file_size INTEGER,
    reward_type reward_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gacha_items_gacha_id ON public.gacha_items(gacha_id);
CREATE INDEX IF NOT EXISTS idx_gacha_items_rarity ON public.gacha_items(rarity);
CREATE INDEX IF NOT EXISTS idx_gacha_items_drop_rate ON public.gacha_items(drop_rate);

-- ========================================
-- Oshi Medal System
-- ========================================

-- Oshi Medals table (VTuber-specific currency)
CREATE TABLE IF NOT EXISTS public.oshi_medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vtuber_id UUID NOT NULL REFERENCES public.vtubers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vtuber_id)
);

CREATE INDEX IF NOT EXISTS idx_oshi_medals_user_id ON public.oshi_medals(user_id);
CREATE INDEX IF NOT EXISTS idx_oshi_medals_vtuber_id ON public.oshi_medals(vtuber_id);

-- Oshi Medal Transactions table
CREATE TABLE IF NOT EXISTS public.oshi_medal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vtuber_id UUID NOT NULL REFERENCES public.vtubers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for earned, negative for spent
    transaction_type VARCHAR(50) NOT NULL, -- 'GACHA_EARNED', 'EXCHANGE_SPENT', 'ADMIN_ADJUSTMENT'
    reference_id UUID, -- gacha_pull_id or exchange_id
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oshi_medal_transactions_user_id ON public.oshi_medal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_oshi_medal_transactions_vtuber_id ON public.oshi_medal_transactions(vtuber_id);
CREATE INDEX IF NOT EXISTS idx_oshi_medal_transactions_created_at ON public.oshi_medal_transactions(created_at);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vtubers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gachas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gacha_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oshi_medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oshi_medal_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- VTubers policies
CREATE POLICY "Approved VTubers are viewable by everyone" ON public.vtubers
    FOR SELECT USING (status = 'APPROVED');

CREATE POLICY "VTubers can manage own data" ON public.vtubers
    FOR ALL USING (auth.uid() = user_id);

-- Gachas policies  
CREATE POLICY "Published gachas are viewable by everyone" ON public.gachas
    FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "VTubers can manage own gachas" ON public.gachas
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.vtubers WHERE id = gachas.vtuber_id
        )
    );

-- Gacha Items policies
CREATE POLICY "Gacha items viewable with parent gacha" ON public.gacha_items
    FOR SELECT USING (
        gacha_id IN (
            SELECT id FROM public.gachas WHERE status = 'PUBLISHED'
        )
    );

CREATE POLICY "VTubers can manage own gacha items" ON public.gacha_items
    FOR ALL USING (
        gacha_id IN (
            SELECT g.id FROM public.gachas g
            JOIN public.vtubers v ON g.vtuber_id = v.id
            WHERE v.user_id = auth.uid()
        )
    );

-- Oshi Medals policies
CREATE POLICY "Users can view own medals" ON public.oshi_medals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own medal transactions" ON public.oshi_medal_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'FAN')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER vtubers_updated_at BEFORE UPDATE ON public.vtubers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER gachas_updated_at BEFORE UPDATE ON public.gachas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER gacha_items_updated_at BEFORE UPDATE ON public.gacha_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER oshi_medals_updated_at BEFORE UPDATE ON public.oshi_medals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Test data (optional - remove in production)
-- INSERT INTO auth.users (id, email) VALUES (uuid_generate_v4(), 'test@example.com');