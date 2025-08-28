-- Koepon Initial Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('FAN', 'VTUBER', 'ADMIN');
CREATE TYPE vtuber_status AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
CREATE TYPE gacha_status AS ENUM ('DRAFT', 'PUBLISHED', 'ENDED', 'SUSPENDED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
CREATE TYPE file_type AS ENUM ('ZIP', 'MP3', 'PNG', 'JPEG', 'WEBP', 'MP4');
CREATE TYPE reward_type AS ENUM ('VOICE', 'IMAGE', 'VIDEO', 'BUNDLE');

-- ========================================
-- Users and Authentication
-- ========================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'FAN',
    is_email_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Sessions table for refresh tokens
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ========================================
-- VTuber Management
-- ========================================

-- VTubers table
CREATE TABLE vtubers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_vtubers_user_id ON vtubers(user_id);
CREATE INDEX idx_vtubers_status ON vtubers(status);
CREATE INDEX idx_vtubers_channel_name ON vtubers(channel_name);

-- ========================================
-- Gacha System
-- ========================================

-- Gachas table
CREATE TABLE gachas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vtuber_id UUID NOT NULL REFERENCES vtubers(id) ON DELETE CASCADE,
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

CREATE INDEX idx_gachas_vtuber_id ON gachas(vtuber_id);
CREATE INDEX idx_gachas_status ON gachas(status);
CREATE INDEX idx_gachas_start_at ON gachas(start_at);
CREATE INDEX idx_gachas_end_at ON gachas(end_at);

-- Gacha items table
CREATE TABLE gacha_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gacha_id UUID NOT NULL REFERENCES gachas(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    rarity INTEGER NOT NULL CHECK (rarity BETWEEN 1 AND 5),
    drop_rate DECIMAL(6, 3) NOT NULL CHECK (drop_rate > 0 AND drop_rate <= 100),
    thumbnail_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gacha_items_gacha_id ON gacha_items(gacha_id);
CREATE INDEX idx_gacha_items_rarity ON gacha_items(rarity);
CREATE INDEX idx_gacha_items_sort_order ON gacha_items(sort_order);

-- ========================================
-- Oshi Medal System
-- ========================================

-- Oshi medals table
CREATE TABLE oshi_medals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    vtuber_id UUID NOT NULL REFERENCES vtubers(id),
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
    total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vtuber_id)
);

CREATE INDEX idx_oshi_medals_user_id ON oshi_medals(user_id);
CREATE INDEX idx_oshi_medals_vtuber_id ON oshi_medals(vtuber_id);
CREATE INDEX idx_oshi_medals_balance ON oshi_medals(balance);

-- ========================================
-- Functions and Triggers
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vtubers_updated_at BEFORE UPDATE ON vtubers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gachas_updated_at BEFORE UPDATE ON gachas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gacha_items_updated_at BEFORE UPDATE ON gacha_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oshi_medals_updated_at BEFORE UPDATE ON oshi_medals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vtubers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gachas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE oshi_medals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id::text);

-- VTubers policies
CREATE POLICY "Anyone can view approved VTubers" ON vtubers
    FOR SELECT USING (status = 'APPROVED');

CREATE POLICY "VTubers can manage their own data" ON vtubers
    FOR ALL USING (auth.uid() = user_id::text);

-- Gachas policies
CREATE POLICY "Anyone can view published gachas" ON gachas
    FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "VTubers can manage their own gachas" ON gachas
    FOR ALL USING (
        vtuber_id IN (
            SELECT id FROM vtubers WHERE user_id::text = auth.uid()
        )
    );

-- Gacha items policies
CREATE POLICY "Anyone can view items from published gachas" ON gacha_items
    FOR SELECT USING (
        gacha_id IN (
            SELECT id FROM gachas WHERE status = 'PUBLISHED'
        )
    );

-- Oshi medals policies
CREATE POLICY "Users can view their own medals" ON oshi_medals
    FOR SELECT USING (auth.uid() = user_id::text);

-- ========================================
-- Initial Data
-- ========================================

-- Create system admin user
INSERT INTO users (id, email, password_hash, username, display_name, role, is_email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@koepon.jp', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY/jrN4U4YhJJwe', 
    'admin', 
    'System Admin', 
    'ADMIN', 
    true
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;