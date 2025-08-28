export const testUsers = {
  normalUser: {
    email: 'test@koepon.com',
    password: 'TestPass123!',
    displayName: 'テストユーザー',
    medalBalance: 1000
  },
  vtuberUser: {
    email: 'vtuber@koepon.com', 
    password: 'VTuberPass123!',
    displayName: 'テストVTuber',
    status: 'approved'
  },
  adminUser: {
    email: 'admin@koepon.com',
    password: 'AdminPass123!',
    role: 'admin'
  }
}

export const testGachas = {
  basicGacha: {
    id: 'gacha-001',
    name: 'テストガチャ',
    price: 100,
    vtuberId: 'vtuber-001',
    items: [
      { name: 'コモン', rarity: 'common', rate: 80 },
      { name: 'レア', rarity: 'rare', rate: 15 },
      { name: 'SSR', rarity: 'ssr', rate: 5 }
    ]
  },
  expensiveGacha: {
    id: 'gacha-002', 
    name: '高額ガチャ',
    price: 500,
    vtuberId: 'vtuber-001'
  }
}

export const testRewards = {
  imageReward: {
    id: 'reward-001',
    name: 'テスト画像',
    type: 'image',
    fileSize: 1024000, // 1MB
    category: 'wallpaper'
  },
  videoReward: {
    id: 'reward-002',
    name: 'テスト動画',  
    type: 'video',
    fileSize: 5242880, // 5MB
    category: 'video'
  }
}

export const testExchangeItems = {
  basicItem: {
    id: 'item-001',
    name: 'テスト交換アイテム',
    cost: 50,
    stock: 100,
    category: 'digital'
  },
  limitedItem: {
    id: 'item-002',
    name: '限定アイテム',
    cost: 200,
    stock: 10,
    limit: 1,
    category: 'limited'
  }
}