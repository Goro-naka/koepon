-- Insert Koepon Test Data - 2025-08-28
-- フロントエンドで使用されているVTuberデータに合わせたテストデータ

-- Create function to insert Koepon test data
CREATE OR REPLACE FUNCTION insert_koepon_test_data()
RETURNS void AS $$
BEGIN
  -- Insert test users (dummy auth users for VTubers)
  INSERT INTO public.users (id, username, display_name, email, birth_date, is_minor, is_active)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'hoshitsuki-hina', '星月ひな', 'hina@hoshitsuki.jp', '1998-12-25', false, true),
    ('22222222-2222-2222-2222-222222222222', 'sakurai-mio', '桜井みお', 'mio@sakurai.jp', '1999-04-10', false, true),
    ('33333333-3333-3333-3333-333333333333', 'otowa-yume', '音羽ゆめ', 'yume@otowa.jp', '2000-07-15', false, true),
    ('44444444-4444-4444-4444-444444444444', 'shirayuki-rin', '白雪りん', 'rin@shirayuki.jp', '1999-11-20', false, true),
    ('55555555-5555-5555-5555-555555555555', 'kouyou-ayane', '紅葉あやね', 'ayane@kouyou.jp', '2000-09-08', false, true),
    ('00000001-0001-0001-0001-000000000001', 'test-user-1', 'テストユーザー1', 'user1@test.com', '1995-01-01', false, true),
    ('00000002-0002-0002-0002-000000000002', 'test-user-2', 'テストユーザー2', 'user2@test.com', '2005-06-15', true, true)
  ON CONFLICT (id) DO NOTHING;

  -- Insert VTubers (matching frontend data)
  INSERT INTO public.vtubers (
    id, user_id, channel_name, description, avatar_url, banner_url,
    subscriber_count, is_verified, youtube_channel_id, twitter_handle,
    debut_date, tags, status, is_active
  ) VALUES 
    (
      'v1111111-1111-1111-1111-111111111111'::uuid,
      '11111111-1111-1111-1111-111111111111'::uuid,
      '星月ひな',
      '夜空の星のような歌声で癒しを届ける星座VTuber。ASMR配信とピアノ演奏が得意です。',
      '/vtuber-avatars/hoshitsuki-hina.jpg',
      '/vtuber-banners/hoshitsuki-hina.jpg',
      156000,
      true,
      'UChina123456',
      '@hoshitsuki_hina',
      '2022-12-25',
      ARRAY['歌', 'ASMR', 'ピアノ', '星座'],
      'active',
      true
    ),
    (
      'v2222222-2222-2222-2222-222222222222'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid,
      '桜井みお',
      '春の桜のように明るく元気なVTuber。料理配信とおしゃべりが大好きです。',
      '/vtuber-avatars/sakurai-mio.jpg',
      '/vtuber-banners/sakurai-mio.jpg',
      89000,
      true,
      'UCmio789012',
      '@sakurai_mio',
      '2023-04-10',
      ARRAY['料理', 'トーク', '雑談', '桜'],
      'active',
      true
    ),
    (
      'v3333333-3333-3333-3333-333333333333'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      '音羽ゆめ',
      '夢の世界からやってきた音楽VTuber。ゲーム実況と作詞作曲が趣味です。',
      '/vtuber-avatars/otowa-yume.jpg',
      '/vtuber-banners/otowa-yume.jpg',
      124000,
      true,
      'UCyume345678',
      '@otowa_yume',
      '2023-07-15',
      ARRAY['音楽', 'ゲーム', '作詞作曲', '夢'],
      'active',
      true
    ),
    (
      'v4444444-4444-4444-4444-444444444444'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      '白雪りん',
      '雪国出身の清楚系VTuber。読書感想や冬のお話が得意です。',
      '/vtuber-avatars/shirayuki-rin.jpg',
      '/vtuber-banners/shirayuki-rin.jpg',
      67000,
      false,
      'UCrin901234',
      '@shirayuki_rin',
      '2023-11-20',
      ARRAY['読書', '雪', '冬', '文学'],
      'active',
      true
    ),
    (
      'v5555555-5555-5555-5555-555555555555'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      '紅葉あやね',
      '秋の紅葉のように美しい歌声を持つVTuber。ダンスと歌が大好きです。',
      '/vtuber-avatars/kouyou-ayane.jpg',
      '/vtuber-banners/kouyou-ayane.jpg',
      98000,
      false,
      'UCayane567890',
      '@kouyou_ayane',
      '2023-09-08',
      ARRAY['歌', 'ダンス', '秋', '紅葉'],
      'active',
      true
    )
  ON CONFLICT (id) DO UPDATE SET
    channel_name = EXCLUDED.channel_name,
    description = EXCLUDED.description,
    subscriber_count = EXCLUDED.subscriber_count,
    is_verified = EXCLUDED.is_verified;

  -- Insert Gacha campaigns (matching frontend data)
  INSERT INTO public.gacha (
    id, name, description, vtuber_id, price, medal_reward,
    start_date, end_date, status, image_url, max_draws, total_draws
  ) VALUES 
    (
      'g1111111-1111-1111-1111-111111111111'::uuid,
      '星月ひな 冬の星座ガチャ',
      '冬の星座をテーマにした限定ガチャ。星座に関する特別なアイテムが当たります！',
      'v1111111-1111-1111-1111-111111111111'::uuid,
      300,
      30,
      '2024-12-01 00:00:00+00',
      '2025-02-28 23:59:59+00',
      'active',
      '/gacha-images/hina-winter-stars.jpg',
      1000,
      245
    ),
    (
      'g2222222-2222-2222-2222-222222222222'::uuid,
      '桜井みお 春の料理ガチャ',
      'みおちゃんの得意料理レシピが当たる春限定ガチャ！',
      'v2222222-2222-2222-2222-222222222222'::uuid,
      250,
      25,
      '2024-03-01 00:00:00+00',
      '2025-05-31 23:59:59+00',
      'active',
      '/gacha-images/mio-spring-cooking.jpg',
      800,
      167
    ),
    (
      'g3333333-3333-3333-3333-333333333333'::uuid,
      '音羽ゆめ ドリームミュージックガチャ',
      'ゆめちゃんのオリジナル楽曲とゲーム実況の限定コンテンツ！',
      'v3333333-3333-3333-3333-333333333333'::uuid,
      400,
      40,
      '2024-07-01 00:00:00+00',
      '2025-09-30 23:59:59+00',
      'active',
      '/gacha-images/yume-dream-music.jpg',
      600,
      289
    ),
    (
      'g4444444-4444-4444-4444-444444444444'::uuid,
      '白雪りん 冬読書ガチャ',
      'りんちゃんおすすめの本の朗読ボイスが当たる静寂のガチャ',
      'v4444444-4444-4444-4444-444444444444'::uuid,
      200,
      20,
      '2024-11-01 00:00:00+00',
      '2025-01-31 23:59:59+00',
      'active',
      '/gacha-images/rin-winter-books.jpg',
      500,
      123
    ),
    (
      'g5555555-5555-5555-5555-555555555555'::uuid,
      '紅葉あやね 秋の歌声ガチャ',
      'あやねちゃんの美しい歌声とダンス動画の秋限定ガチャ',
      'v5555555-5555-5555-5555-555555555555'::uuid,
      350,
      35,
      '2024-09-01 00:00:00+00',
      '2025-11-30 23:59:59+00',
      'active',
      '/gacha-images/ayane-autumn-songs.jpg',
      700,
      198
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    total_draws = EXCLUDED.total_draws,
    status = EXCLUDED.status;

  -- Insert Gacha items (rich variety for each VTuber)
  INSERT INTO public.gacha_item (
    id, gacha_id, name, description, image_url, rarity, drop_rate, 
    estimated_value, display_order, is_featured
  ) VALUES 
    -- 星月ひな Gacha Items
    ('gi111111-1111-1111-1111-111111111111', 'g1111111-1111-1111-1111-111111111111', 
     '星座のお守りメダル', 'ひなちゃんが手作りした星座のお守り', '/items/hina-constellation-charm.jpg',
     'N', 45.0, 50, 1, false),
    ('gi111111-1111-1111-1111-111111111112', 'g1111111-1111-1111-1111-111111111111',
     '冬の夜空ボイス', '星を見上げながらの癒しボイス(5分)', '/items/hina-winter-voice.jpg',
     'R', 30.0, 150, 2, false),
    ('gi111111-1111-1111-1111-111111111113', 'g1111111-1111-1111-1111-111111111111',
     'ピアノ演奏動画', 'ショパン「幻想即興曲」の演奏動画', '/items/hina-piano-performance.jpg',
     'SR', 18.0, 400, 3, true),
    ('gi111111-1111-1111-1111-111111111114', 'g1111111-1111-1111-1111-111111111111',
     'プライベート星座解説', '12星座の秘密を教える限定動画(20分)', '/items/hina-constellation-guide.jpg',
     'SSR', 6.0, 800, 4, true),
    ('gi111111-1111-1111-1111-111111111115', 'g1111111-1111-1111-1111-111111111111',
     '直筆星図', 'ひなちゃんが描いた手書きの星図', '/items/hina-handwritten-starmap.jpg',
     'UR', 1.0, 2000, 5, true),

    -- 桜井みお Gacha Items  
    ('gi222222-2222-2222-2222-222222222221', 'g2222222-2222-2222-2222-222222222222',
     'お料理レシピカード', 'みおちゃん特製ハンバーグのレシピ', '/items/mio-recipe-card.jpg',
     'N', 40.0, 50, 1, false),
    ('gi222222-2222-2222-2222-222222222222', 'g2222222-2222-2222-2222-222222222222',
     'お料理実演ボイス', '一緒にお料理する気分になれるボイス', '/items/mio-cooking-voice.jpg',
     'R', 32.0, 150, 2, false),
    ('gi222222-2222-2222-2222-222222222223', 'g2222222-2222-2222-2222-222222222222',
     '桜餅作り動画', '春の桜餅を一緒に作る動画(15分)', '/items/mio-sakuramochi-video.jpg',
     'SR', 20.0, 400, 3, true),
    ('gi222222-2222-2222-2222-222222222224', 'g2222222-2222-2222-2222-222222222222',
     'みおちゃんとお茶会', 'バーチャルお茶会限定配信(30分)', '/items/mio-tea-party.jpg',
     'SSR', 7.0, 800, 4, true),
    ('gi222222-2222-2222-2222-222222222225', 'g2222222-2222-2222-2222-222222222222',
     '手作りエプロン写真', 'みおちゃんが実際に使っているエプロンの写真', '/items/mio-handmade-apron.jpg',
     'UR', 1.0, 2000, 5, true),

    -- 音羽ゆめ Gacha Items
    ('gi333333-3333-3333-3333-333333333331', 'g3333333-3333-3333-3333-333333333333',
     'オリジナル楽譜', 'ゆめちゃん作曲のオリジナル楽譜', '/items/yume-original-score.jpg',
     'N', 42.0, 50, 1, false),
    ('gi333333-3333-3333-3333-333333333332', 'g3333333-3333-3333-3333-333333333333',
     'ゲーム実況音声', 'ホラーゲーム実況の面白場面集', '/items/yume-game-voice.jpg',
     'R', 28.0, 150, 2, false),
    ('gi333333-3333-3333-3333-333333333333', 'g3333333-3333-3333-3333-333333333333',
     '作詞作曲レッスン', '音楽制作のコツを教える動画(25分)', '/items/yume-music-lesson.jpg',
     'SR', 22.0, 400, 3, true),
    ('gi333333-3333-3333-3333-333333333334', 'g3333333-3333-3333-3333-333333333333',
     'デモ音源', '未発表楽曲のデモ版音源', '/items/yume-demo-track.jpg',
     'SSR', 7.0, 800, 4, true),
    ('gi333333-3333-3333-3333-333333333335', 'g3333333-3333-3333-3333-333333333333',
     '直筆歌詞ノート', 'ゆめちゃんの手書き歌詞ノート1ページ', '/items/yume-handwritten-lyrics.jpg',
     'UR', 1.0, 2000, 5, true),

    -- 白雪りん Gacha Items
    ('gi444444-4444-4444-4444-444444444441', 'g4444444-4444-4444-4444-444444444444',
     '読書感想文', 'りんちゃんの手書き読書感想文', '/items/rin-book-review.jpg',
     'N', 48.0, 50, 1, false),
    ('gi444444-4444-4444-4444-444444444442', 'g4444444-4444-4444-4444-444444444444',
     '朗読ボイス', '名作小説の朗読ボイス(10分)', '/items/rin-reading-voice.jpg',
     'R', 35.0, 150, 2, false),
    ('gi444444-4444-4444-4444-444444444443', 'g4444444-4444-4444-4444-444444444444',
     '雪景色写真集', 'りんちゃんが撮影した雪景色写真', '/items/rin-snow-photos.jpg',
     'SR', 15.0, 400, 3, true),
    ('gi444444-4444-4444-4444-444444444444', 'g4444444-4444-4444-4444-444444444444',
     '冬の読書会', 'プライベート読書会配信(40分)', '/items/rin-reading-session.jpg',
     'SSR', 5.0, 800, 4, true),
    ('gi444444-4444-4444-4444-444444444445', 'g4444444-4444-4444-4444-444444444444',
     '手作りブックマーク', 'りんちゃんが手作りした雪の結晶ブックマーク', '/items/rin-handmade-bookmark.jpg',
     'UR', 1.0, 2000, 5, true),

    -- 紅葉あやね Gacha Items
    ('gi555555-5555-5555-5555-555555555551', 'g5555555-5555-5555-5555-555555555555',
     '秋の歌詞カード', 'あやねちゃん作詞の秋をテーマにした歌', '/items/ayane-autumn-lyrics.jpg',
     'N', 44.0, 50, 1, false),
    ('gi555555-5555-5555-5555-555555555552', 'g5555555-5555-5555-5555-555555555555',
     'ダンスレッスン動画', '基本ステップから教えるダンス動画', '/items/ayane-dance-lesson.jpg',
     'R', 31.0, 150, 2, false),
    ('gi555555-5555-5555-5555-555555555553', 'g5555555-5555-5555-5555-555555555555',
     '秋の歌声コンサート', '紅葉をバックにした野外コンサート動画', '/items/ayane-autumn-concert.jpg',
     'SR', 19.0, 400, 3, true),
    ('gi555555-5555-5555-5555-555555555554', 'g5555555-5555-5555-5555-555555555555',
     'プライベート歌唱指導', '歌のコツを個人指導する限定動画', '/items/ayane-vocal-coaching.jpg',
     'SSR', 5.0, 800, 4, true),
    ('gi555555-5555-5555-5555-555555555555', 'g5555555-5555-5555-5555-555555555555',
     '直筆楽譜サイン入り', 'あやねちゃんの直筆サイン入りオリジナル楽譜', '/items/ayane-signed-score.jpg',
     'UR', 1.0, 2000, 5, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rarity = EXCLUDED.rarity,
    drop_rate = EXCLUDED.drop_rate;

  -- Insert test user points
  INSERT INTO public.user_points (user_id, balance, total_purchased, total_spent)
  VALUES 
    ('00000001-0001-0001-0001-000000000001', 5000, 10000, 5000),
    ('00000002-0002-0002-0002-000000000002', 800, 1000, 200)
  ON CONFLICT (user_id) DO UPDATE SET 
    balance = EXCLUDED.balance,
    total_purchased = EXCLUDED.total_purchased,
    total_spent = EXCLUDED.total_spent;

  -- Insert some test inventory items
  INSERT INTO public.user_inventory (user_id, item_id, quantity)
  VALUES 
    ('00000001-0001-0001-0001-000000000001', 'gi111111-1111-1111-1111-111111111111', 3),
    ('00000001-0001-0001-0001-000000000001', 'gi111111-1111-1111-1111-111111111112', 2),
    ('00000001-0001-0001-0001-000000000001', 'gi222222-2222-2222-2222-222222222221', 5),
    ('00000002-0002-0002-0002-000000000002', 'gi333333-3333-3333-3333-333333333331', 1),
    ('00000002-0002-0002-0002-000000000002', 'gi444444-4444-4444-4444-444444444441', 2)
  ON CONFLICT (user_id, item_id) DO UPDATE SET
    quantity = EXCLUDED.quantity;

  RAISE NOTICE 'Koepon test data inserted successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to insert test data
SELECT insert_koepon_test_data();