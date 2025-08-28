-- Update schema for Gacha and VTuber entities to match NestJS entities
-- Date: 2025-01-08

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.gacha_campaigns DROP CONSTRAINT IF EXISTS gacha_campaigns_vtuber_id_fkey;
ALTER TABLE public.gacha_items DROP CONSTRAINT IF EXISTS gacha_items_campaign_id_fkey;

-- Rename tables to match entity names
ALTER TABLE public.gacha_campaigns RENAME TO gacha;
ALTER TABLE public.gacha_items RENAME TO gacha_item;
ALTER TABLE public.gacha_pulls RENAME TO gacha_result;

-- Update gacha table structure
ALTER TABLE public.gacha
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS medal_reward INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'ended')),
  ADD COLUMN IF NOT EXISTS max_draws INTEGER,
  ADD COLUMN IF NOT EXISTS total_draws INTEGER DEFAULT 0;

-- Rename columns to match entity
ALTER TABLE public.gacha RENAME COLUMN cost_points TO price;

-- Update gacha_item table structure
ALTER TABLE public.gacha_item
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Rename gacha_id column
ALTER TABLE public.gacha_item RENAME COLUMN campaign_id TO gacha_id;

-- Update gacha_result table structure
ALTER TABLE public.gacha_result
  ADD COLUMN IF NOT EXISTS gacha_id UUID,
  ADD COLUMN IF NOT EXISTS drawn_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE;

-- Rename columns
ALTER TABLE public.gacha_result RENAME COLUMN campaign_id TO gacha_id;
ALTER TABLE public.gacha_result RENAME COLUMN points_spent TO cost;
ALTER TABLE public.gacha_result RENAME COLUMN pull_result TO result_data;

-- Add VTuber entity fields
ALTER TABLE public.vtubers
  ADD COLUMN IF NOT EXISTS youtube_channel_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(100),
  ADD COLUMN IF NOT EXISTS debut_date DATE,
  ADD COLUMN IF NOT EXISTS graduation_date DATE,
  ADD COLUMN IF NOT EXISTS total_donations DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_listeners INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'hiatus', 'suspended'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_gacha_status ON public.gacha(status);
CREATE INDEX IF NOT EXISTS idx_gacha_vtuber_id ON public.gacha(vtuber_id);
CREATE INDEX IF NOT EXISTS idx_gacha_item_gacha_id ON public.gacha_item(gacha_id);
CREATE INDEX IF NOT EXISTS idx_gacha_item_rarity ON public.gacha_item(rarity);
CREATE INDEX IF NOT EXISTS idx_gacha_result_user_id ON public.gacha_result(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_result_gacha_id ON public.gacha_result(gacha_id);
CREATE INDEX IF NOT EXISTS idx_vtubers_status ON public.vtubers(status);
CREATE INDEX IF NOT EXISTS idx_vtubers_debut_date ON public.vtubers(debut_date);

-- Re-add foreign key constraints
ALTER TABLE public.gacha 
  ADD CONSTRAINT gacha_vtuber_id_fkey 
  FOREIGN KEY (vtuber_id) REFERENCES public.vtubers(id) ON DELETE CASCADE;

ALTER TABLE public.gacha_item 
  ADD CONSTRAINT gacha_item_gacha_id_fkey 
  FOREIGN KEY (gacha_id) REFERENCES public.gacha(id) ON DELETE CASCADE;

ALTER TABLE public.gacha_result
  ADD CONSTRAINT gacha_result_gacha_id_fkey
  FOREIGN KEY (gacha_id) REFERENCES public.gacha(id) ON DELETE CASCADE;

-- Create function to insert test data
CREATE OR REPLACE FUNCTION insert_test_data()
RETURNS void AS $$
BEGIN
  -- Insert test VTubers
  INSERT INTO public.vtubers (
    id, user_id, channel_name, description, avatar_url, banner_url, 
    subscriber_count, is_verified, youtube_channel_id, twitter_handle,
    debut_date, tags, status
  ) VALUES 
    (
      'a0000000-0000-0000-0000-000000000001'::uuid,
      '00000000-0000-0000-0000-000000000002'::uuid,
      'Hoshino Luna',
      '人気Vtuberのホシノルナです！歌とゲーム配信をメインに活動しています。',
      'https://example.com/avatars/luna.jpg',
      'https://example.com/banners/luna.jpg',
      125000,
      true,
      'UC1234567890',
      '@hoshino_luna',
      '2023-01-15',
      ARRAY['歌', 'ゲーム', 'ASMR'],
      'active'
    ),
    (
      'a0000000-0000-0000-0000-000000000002'::uuid,
      '00000000-0000-0000-0000-000000000003'::uuid,
      'Sakura Miko',
      'エリート巫女のさくらみこです！面白い配信を心がけています！',
      'https://example.com/avatars/miko.jpg',
      'https://example.com/banners/miko.jpg',
      89000,
      true,
      'UC0987654321',
      '@sakura_miko',
      '2023-03-20',
      ARRAY['ゲーム', 'トーク', '企画'],
      'active'
    ),
    (
      'a0000000-0000-0000-0000-000000000003'::uuid,
      null,
      'Amano Pikamee',
      'でんきねずみVtuberのピカミィです！楽しく元気に配信中！',
      'https://example.com/avatars/pikamee.jpg',
      'https://example.com/banners/pikamee.jpg',
      56000,
      false,
      'UC1122334455',
      '@amano_pikamee',
      '2023-06-01',
      ARRAY['雑談', 'ゲーム', '歌'],
      'active'
    )
  ON CONFLICT (id) DO UPDATE SET
    channel_name = EXCLUDED.channel_name,
    description = EXCLUDED.description,
    subscriber_count = EXCLUDED.subscriber_count;

  -- Insert test Gacha campaigns
  INSERT INTO public.gacha (
    id, name, description, vtuber_id, price, medal_reward,
    start_date, end_date, status, image_url, max_draws
  ) VALUES 
    (
      'b0000000-0000-0000-0000-000000000001'::uuid,
      'ホシノルナ 1st Anniversary ガチャ',
      'デビュー1周年記念！限定メダルが手に入るスペシャルガチャ！',
      'a0000000-0000-0000-0000-000000000001'::uuid,
      300,
      30,
      '2024-01-01 00:00:00+00',
      '2025-12-31 23:59:59+00',
      'active',
      'https://example.com/gacha/luna_1st.jpg',
      100
    ),
    (
      'b0000000-0000-0000-0000-000000000002'::uuid,
      'さくらみこ Birthday ガチャ',
      'みこちの誕生日を祝おう！限定ボイスメダル登場！',
      'a0000000-0000-0000-0000-000000000002'::uuid,
      500,
      50,
      '2024-03-01 00:00:00+00',
      '2025-03-31 23:59:59+00',
      'active',
      'https://example.com/gacha/miko_birthday.jpg',
      50
    ),
    (
      'b0000000-0000-0000-0000-000000000003'::uuid,
      'ピカミィ サマーフェスガチャ',
      '夏限定！水着衣装のメダルが手に入る！',
      'a0000000-0000-0000-0000-000000000003'::uuid,
      200,
      20,
      '2024-07-01 00:00:00+00',
      '2024-08-31 23:59:59+00',
      'ended',
      'https://example.com/gacha/pikamee_summer.jpg',
      null
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status;

  -- Insert test Gacha items
  INSERT INTO public.gacha_item (
    id, gacha_id, name, description, image_url, rarity, drop_rate, 
    estimated_value, display_order, is_featured
  ) VALUES 
    -- Luna Anniversary Gacha Items
    ('c0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid,
     'ルナ 通常メダル', '通常のルナちゃんメダル', 'https://example.com/medals/luna_n.jpg',
     'N', 60.0, 10, 1, false),
    ('c0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid,
     'ルナ レアボイスメダル', 'レアボイス付きメダル', 'https://example.com/medals/luna_r.jpg',
     'R', 30.0, 50, 2, false),
    ('c0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid,
     'ルナ 限定衣装メダル', '1周年限定衣装メダル', 'https://example.com/medals/luna_sr.jpg',
     'SR', 8.0, 200, 3, true),
    ('c0000000-0000-0000-0000-000000000004'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid,
     'ルナ サイン入りメダル', '直筆サイン入りSSRメダル', 'https://example.com/medals/luna_ssr.jpg',
     'SSR', 2.0, 1000, 4, true),
     
    -- Miko Birthday Gacha Items
    ('c0000000-0000-0000-0000-000000000005'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
     'みこ 通常メダル', 'エリート巫女メダル', 'https://example.com/medals/miko_n.jpg',
     'N', 55.0, 10, 1, false),
    ('c0000000-0000-0000-0000-000000000006'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
     'みこ FAQ大全メダル', 'FAQ集録メダル', 'https://example.com/medals/miko_r.jpg',
     'R', 32.0, 50, 2, false),
    ('c0000000-0000-0000-0000-000000000007'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
     'みこ 誕生日限定メダル', '誕生日限定デザイン', 'https://example.com/medals/miko_sr.jpg',
     'SR', 10.0, 300, 3, true),
    ('c0000000-0000-0000-0000-000000000008'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid,
     'みこ プレミアムメダル', 'プレミアム限定メダル', 'https://example.com/medals/miko_ssr.jpg',
     'SSR', 3.0, 1500, 4, true),
     
    -- Pikamee Summer Gacha Items
    ('c0000000-0000-0000-0000-000000000009'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
     'ピカミィ 通常メダル', '元気いっぱいメダル', 'https://example.com/medals/pikamee_n.jpg',
     'N', 65.0, 10, 1, false),
    ('c0000000-0000-0000-0000-00000000000a'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
     'ピカミィ サマーメダル', '夏限定メダル', 'https://example.com/medals/pikamee_r.jpg',
     'R', 25.0, 50, 2, false),
    ('c0000000-0000-0000-0000-00000000000b'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
     'ピカミィ 水着メダル', '水着衣装メダル', 'https://example.com/medals/pikamee_sr.jpg',
     'SR', 7.0, 250, 3, true),
    ('c0000000-0000-0000-0000-00000000000c'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid,
     'ピカミィ 花火メダル', '花火大会限定SSR', 'https://example.com/medals/pikamee_ssr.jpg',
     'SSR', 3.0, 1200, 4, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rarity = EXCLUDED.rarity,
    drop_rate = EXCLUDED.drop_rate;

  -- Add some test user inventory items
  INSERT INTO public.user_inventory (user_id, item_id, quantity)
  VALUES 
    ('00000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 5),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 2),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 1)
  ON CONFLICT (user_id, item_id) DO UPDATE SET
    quantity = EXCLUDED.quantity;

  RAISE NOTICE 'Test data inserted successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the test data insertion
SELECT insert_test_data();