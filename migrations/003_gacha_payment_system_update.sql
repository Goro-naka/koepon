-- Migration 003: Update payment system to use gacha-based purchases
-- Date: 2024-01-15
-- Description: Replace medal package system with direct gacha purchases and add push medal system

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Update Gacha System
-- ========================================

-- Update gachas table to match interface requirements
ALTER TABLE public.gachas 
DROP COLUMN IF EXISTS medal_per_pull,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN start_at DROP NOT NULL,
ALTER COLUMN end_at DROP NOT NULL,
DROP CONSTRAINT IF EXISTS check_gacha_dates;

-- Rename columns to match interface
ALTER TABLE public.gachas 
RENAME COLUMN start_at TO start_date;
ALTER TABLE public.gachas 
RENAME COLUMN end_at TO end_date;

-- Add constraint back with new column names
ALTER TABLE public.gachas 
ADD CONSTRAINT check_gacha_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date);

-- Update indexes
DROP INDEX IF EXISTS idx_gachas_dates;
CREATE INDEX IF NOT EXISTS idx_gachas_dates ON public.gachas(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_gachas_is_active ON public.gachas(is_active);

-- ========================================
-- Payment System Updates
-- ========================================

-- Drop medal_packages table if it exists (no longer needed)
DROP TABLE IF EXISTS public.medal_packages CASCADE;

-- Create/Update payments table to support gacha purchases
DROP TABLE IF EXISTS public.payments CASCADE;
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    gacha_id UUID NOT NULL REFERENCES public.gachas(id) ON DELETE RESTRICT,
    gacha_count INTEGER NOT NULL CHECK (gacha_count > 0),
    status payment_status NOT NULL DEFAULT 'PENDING',
    currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
    payment_method VARCHAR(50),
    metadata JSONB,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_gacha_id ON public.payments(gacha_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Add refund status type if not exists
DO $$ BEGIN
    CREATE TYPE refund_status AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create/Update refunds table
DROP TABLE IF EXISTS public.refunds CASCADE;
CREATE TABLE public.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_refund_id VARCHAR(255),
    amount INTEGER NOT NULL CHECK (amount > 0),
    medal_amount INTEGER, -- For push medal adjustment
    status refund_status NOT NULL DEFAULT 'PENDING',
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON public.refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at);

-- ========================================
-- Push Medal System
-- ========================================

-- Create push medal transaction types
DO $$ BEGIN
    CREATE TYPE push_medal_transaction_type AS ENUM (
        'GACHA_REWARD', 
        'SPECIAL_BONUS', 
        'EXCHANGE_CONSUMPTION', 
        'ADMIN_ADJUSTMENT',
        'TRANSFER_FROM_POOL',
        'REFUND_ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create push medal balances table
CREATE TABLE IF NOT EXISTS public.push_medal_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vtuber_id UUID REFERENCES public.vtubers(id) ON DELETE CASCADE, -- NULL for pool balance
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, vtuber_id)
);

-- Create indexes for push medal balances
CREATE INDEX IF NOT EXISTS idx_push_medal_balances_user_vtuber ON public.push_medal_balances(user_id, vtuber_id);
CREATE INDEX IF NOT EXISTS idx_push_medal_balances_user ON public.push_medal_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_push_medal_balances_vtuber ON public.push_medal_balances(vtuber_id);

-- Create push medal transactions table
CREATE TABLE IF NOT EXISTS public.push_medal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vtuber_id UUID REFERENCES public.vtubers(id) ON DELETE CASCADE,
    transaction_type push_medal_transaction_type NOT NULL,
    amount INTEGER NOT NULL CHECK (amount != 0),
    balance_before INTEGER NOT NULL CHECK (balance_before >= 0),
    balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
    reference_id UUID, -- gacha_id, payment_id, etc.
    reference_type VARCHAR(50), -- 'gacha', 'payment', 'transfer', etc.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for push medal transactions
CREATE INDEX IF NOT EXISTS idx_push_medal_transactions_user_created ON public.push_medal_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_medal_transactions_vtuber_created ON public.push_medal_transactions(vtuber_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_medal_transactions_reference ON public.push_medal_transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_push_medal_transactions_type ON public.push_medal_transactions(transaction_type);

-- ========================================
-- Row Level Security Updates
-- ========================================

-- Enable RLS on new tables
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_medal_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_medal_transactions ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own refunds" ON public.refunds
    FOR SELECT USING (auth.uid() = user_id);

-- Push medal policies
CREATE POLICY "Users can view own push medal balances" ON public.push_medal_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own push medal transactions" ON public.push_medal_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- VTubers can view medal transactions for their content
CREATE POLICY "VTubers can view transactions for their content" ON public.push_medal_transactions
    FOR SELECT USING (
        vtuber_id IN (
            SELECT id FROM public.vtubers WHERE user_id = auth.uid()
        )
    );

-- ========================================
-- Functions and Triggers
-- ========================================

-- Add updated_at triggers for new tables
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER push_medal_balances_updated_at BEFORE UPDATE ON public.push_medal_balances
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to calculate push medals from gacha cost
CREATE OR REPLACE FUNCTION public.calculate_push_medals(gacha_cost INTEGER, gacha_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Base calculation: cost / 10 per gacha pull
    -- Min 10 medals, max 1000 medals per transaction
    RETURN GREATEST(10, LEAST(1000, (gacha_cost / 10) * gacha_count));
END;
$$ LANGUAGE plpgsql;

-- Function to update push medal balance
CREATE OR REPLACE FUNCTION public.update_push_medal_balance(
    p_user_id UUID,
    p_vtuber_id UUID,
    p_amount INTEGER,
    p_transaction_type push_medal_transaction_type,
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_id UUID;
BEGIN
    -- Get current balance (create if doesn't exist)
    SELECT balance INTO current_balance 
    FROM public.push_medal_balances 
    WHERE user_id = p_user_id AND vtuber_id = p_vtuber_id;
    
    IF current_balance IS NULL THEN
        current_balance := 0;
        INSERT INTO public.push_medal_balances (user_id, vtuber_id, balance)
        VALUES (p_user_id, p_vtuber_id, 0)
        ON CONFLICT (user_id, vtuber_id) DO NOTHING;
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance + p_amount;
    
    -- Check balance won't go negative
    IF new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient push medal balance. Current: %, Attempted: %', current_balance, p_amount;
    END IF;
    
    -- Update balance
    UPDATE public.push_medal_balances 
    SET balance = new_balance, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND vtuber_id = p_vtuber_id;
    
    -- Insert transaction record
    INSERT INTO public.push_medal_transactions (
        user_id, vtuber_id, transaction_type, amount, 
        balance_before, balance_after, reference_id, reference_type, metadata
    ) VALUES (
        p_user_id, p_vtuber_id, p_transaction_type, p_amount,
        current_balance, new_balance, p_reference_id, p_reference_type, p_metadata
    ) RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Update old oshi_medal references
-- ========================================

-- The old oshi_medals system is replaced by push_medal_balances
-- Keep the old tables for now but rename them to avoid conflicts

-- Rename old oshi medal tables
ALTER TABLE IF EXISTS public.oshi_medals RENAME TO oshi_medals_legacy;
ALTER TABLE IF EXISTS public.oshi_medal_transactions RENAME TO oshi_medal_transactions_legacy;

-- ========================================
-- Data Migration (if needed)
-- ========================================

-- Note: Add any necessary data migration logic here
-- This migration assumes a clean start with the new gacha-based system

-- ========================================
-- Test Data (Development Only)
-- ========================================

-- Uncomment and modify for development testing
/*
-- Insert a test VTuber
INSERT INTO public.vtubers (id, user_id, channel_name, status) 
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM auth.users LIMIT 1),
    'Test VTuber',
    'APPROVED'
) ON CONFLICT DO NOTHING;

-- Insert a test gacha
INSERT INTO public.gachas (id, vtuber_id, name, single_price, ten_pull_price, status, is_active)
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM public.vtubers LIMIT 1),
    'Test Gacha',
    300,
    2700,
    'PUBLISHED',
    true
) ON CONFLICT DO NOTHING;
*/