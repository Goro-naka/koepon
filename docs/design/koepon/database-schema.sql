-- ========================================
-- PostgreSQL 15 Database Schema for Koepon!
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- Users and Authentication
-- ========================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'FAN' CHECK (role IN ('FAN', 'VTUBER', 'ADMIN')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED')),
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
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ENDED', 'SUSPENDED')),
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

-- Gacha rewards table
CREATE TABLE gacha_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gacha_item_id UUID NOT NULL REFERENCES gacha_items(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('VOICE', 'IMAGE', 'VIDEO', 'BUNDLE')),
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('ZIP', 'MP3', 'PNG', 'JPEG', 'WEBP', 'MP4')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gacha_rewards_gacha_item_id ON gacha_rewards(gacha_item_id);
CREATE INDEX idx_gacha_rewards_type ON gacha_rewards(type);

-- ========================================
-- Payment System
-- ========================================

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    gacha_id UUID NOT NULL REFERENCES gachas(id),
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('STRIPE', 'KOMOJU')),
    provider_payment_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    metadata JSONB,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_gacha_id ON payments(gacha_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_idempotency_key ON payments(idempotency_key);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- ========================================
-- Gacha Pull System
-- ========================================

-- Gacha pulls table
CREATE TABLE gacha_pulls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    gacha_id UUID NOT NULL REFERENCES gachas(id),
    payment_id UUID NOT NULL REFERENCES payments(id),
    pull_count INTEGER NOT NULL CHECK (pull_count IN (1, 10)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gacha_pulls_user_id ON gacha_pulls(user_id);
CREATE INDEX idx_gacha_pulls_gacha_id ON gacha_pulls(gacha_id);
CREATE INDEX idx_gacha_pulls_payment_id ON gacha_pulls(payment_id);
CREATE INDEX idx_gacha_pulls_created_at ON gacha_pulls(created_at);

-- Gacha pull results table
CREATE TABLE gacha_pull_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gacha_pull_id UUID NOT NULL REFERENCES gacha_pulls(id) ON DELETE CASCADE,
    gacha_item_id UUID NOT NULL REFERENCES gacha_items(id),
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gacha_pull_id, position)
);

CREATE INDEX idx_gacha_pull_results_gacha_pull_id ON gacha_pull_results(gacha_pull_id);
CREATE INDEX idx_gacha_pull_results_gacha_item_id ON gacha_pull_results(gacha_item_id);

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

-- Oshi medal transactions table
CREATE TABLE oshi_medal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    vtuber_id UUID NOT NULL REFERENCES vtubers(id),
    oshi_medal_id UUID NOT NULL REFERENCES oshi_medals(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('EARNED', 'SPENT')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    balance INTEGER NOT NULL CHECK (balance >= 0),
    reason VARCHAR(255) NOT NULL,
    reference_type VARCHAR(20) CHECK (reference_type IN ('GACHA_PULL', 'EXCHANGE', 'CAMPAIGN')),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oshi_medal_transactions_user_id ON oshi_medal_transactions(user_id);
CREATE INDEX idx_oshi_medal_transactions_vtuber_id ON oshi_medal_transactions(vtuber_id);
CREATE INDEX idx_oshi_medal_transactions_oshi_medal_id ON oshi_medal_transactions(oshi_medal_id);
CREATE INDEX idx_oshi_medal_transactions_type ON oshi_medal_transactions(type);
CREATE INDEX idx_oshi_medal_transactions_reference ON oshi_medal_transactions(reference_type, reference_id);
CREATE INDEX idx_oshi_medal_transactions_created_at ON oshi_medal_transactions(created_at);

-- ========================================
-- Exchange System
-- ========================================

-- Exchange items table
CREATE TABLE exchange_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vtuber_id UUID NOT NULL REFERENCES vtubers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    required_medals INTEGER NOT NULL CHECK (required_medals > 0),
    max_exchange_count INTEGER CHECK (max_exchange_count > 0),
    available_from TIMESTAMP WITH TIME ZONE NOT NULL,
    available_to TIMESTAMP WITH TIME ZONE NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_exchange_dates CHECK (available_to > available_from)
);

CREATE INDEX idx_exchange_items_vtuber_id ON exchange_items(vtuber_id);
CREATE INDEX idx_exchange_items_available_from ON exchange_items(available_from);
CREATE INDEX idx_exchange_items_available_to ON exchange_items(available_to);
CREATE INDEX idx_exchange_items_sort_order ON exchange_items(sort_order);

-- Exchange rewards table
CREATE TABLE exchange_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_item_id UUID NOT NULL REFERENCES exchange_items(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('VOICE', 'IMAGE', 'VIDEO', 'BUNDLE')),
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('ZIP', 'MP3', 'PNG', 'JPEG', 'WEBP', 'MP4')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exchange_rewards_exchange_item_id ON exchange_rewards(exchange_item_id);

-- Exchange history table
CREATE TABLE exchange_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    exchange_item_id UUID NOT NULL REFERENCES exchange_items(id),
    medal_cost INTEGER NOT NULL CHECK (medal_cost > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exchange_history_user_id ON exchange_history(user_id);
CREATE INDEX idx_exchange_history_exchange_item_id ON exchange_history(exchange_item_id);
CREATE INDEX idx_exchange_history_created_at ON exchange_history(created_at);

-- User exchange count tracking
CREATE TABLE user_exchange_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    exchange_item_id UUID NOT NULL REFERENCES exchange_items(id),
    count INTEGER NOT NULL DEFAULT 1 CHECK (count > 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exchange_item_id)
);

CREATE INDEX idx_user_exchange_counts_user_id ON user_exchange_counts(user_id);
CREATE INDEX idx_user_exchange_counts_exchange_item_id ON user_exchange_counts(exchange_item_id);

-- ========================================
-- User Rewards System
-- ========================================

-- User rewards table
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('GACHA', 'EXCHANGE')),
    reward_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    file_url TEXT NOT NULL,
    download_count INTEGER NOT NULL DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX idx_user_rewards_reward_type ON user_rewards(reward_type);
CREATE INDEX idx_user_rewards_reward_id ON user_rewards(reward_id);
CREATE INDEX idx_user_rewards_created_at ON user_rewards(created_at);

-- ========================================
-- File Management
-- ========================================

-- File uploads table
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('ZIP', 'MP3', 'PNG', 'JPEG', 'WEBP', 'MP4')),
    content_type VARCHAR(100) NOT NULL,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_uploads_uploader_id ON file_uploads(uploader_id);
CREATE INDEX idx_file_uploads_status ON file_uploads(status);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);

-- ========================================
-- Audit and Analytics
-- ========================================

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- VTuber statistics table
CREATE TABLE vtuber_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vtuber_id UUID NOT NULL REFERENCES vtubers(id),
    date DATE NOT NULL,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    total_pulls INTEGER NOT NULL DEFAULT 0,
    unique_users INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    medals_earned INTEGER NOT NULL DEFAULT 0,
    medals_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vtuber_id, date)
);

CREATE INDEX idx_vtuber_statistics_vtuber_id ON vtuber_statistics(vtuber_id);
CREATE INDEX idx_vtuber_statistics_date ON vtuber_statistics(date);

-- System statistics table
CREATE TABLE system_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_users INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    total_revenue INTEGER NOT NULL DEFAULT 0,
    total_pulls INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_statistics_date ON system_statistics(date);

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

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vtubers_updated_at BEFORE UPDATE ON vtubers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gachas_updated_at BEFORE UPDATE ON gachas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gacha_items_updated_at BEFORE UPDATE ON gacha_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oshi_medals_updated_at BEFORE UPDATE ON oshi_medals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_items_updated_at BEFORE UPDATE ON exchange_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate gacha drop rates sum to 100%
CREATE OR REPLACE FUNCTION validate_gacha_drop_rates()
RETURNS TRIGGER AS $$
DECLARE
    total_rate DECIMAL(6, 3);
BEGIN
    SELECT SUM(drop_rate) INTO total_rate
    FROM gacha_items
    WHERE gacha_id = NEW.gacha_id AND id != NEW.id;
    
    IF total_rate + NEW.drop_rate > 100 THEN
        RAISE EXCEPTION 'Total drop rates exceed 100%%';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_gacha_drop_rates_trigger
    BEFORE INSERT OR UPDATE ON gacha_items
    FOR EACH ROW EXECUTE FUNCTION validate_gacha_drop_rates();

-- Function to update oshi medal balance
CREATE OR REPLACE FUNCTION update_oshi_medal_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'EARNED' THEN
        UPDATE oshi_medals
        SET balance = balance + NEW.amount,
            total_earned = total_earned + NEW.amount
        WHERE id = NEW.oshi_medal_id;
    ELSIF NEW.type = 'SPENT' THEN
        UPDATE oshi_medals
        SET balance = balance - NEW.amount,
            total_spent = total_spent + NEW.amount
        WHERE id = NEW.oshi_medal_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_oshi_medal_balance_trigger
    AFTER INSERT ON oshi_medal_transactions
    FOR EACH ROW EXECUTE FUNCTION update_oshi_medal_balance();

-- ========================================
-- Initial Data and Permissions
-- ========================================

-- Create admin user (password should be changed immediately)
-- Password: 'changeMe123!' (bcrypt hash)
INSERT INTO users (email, password_hash, username, display_name, role, is_email_verified)
VALUES ('admin@koepon.jp', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY/jrN4U4YhJJwe', 'admin', 'System Admin', 'ADMIN', true);

-- Grant permissions (adjust based on your database user structure)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO koepon_app;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO koepon_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO koepon_app;