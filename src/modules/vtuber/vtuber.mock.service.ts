import { Injectable } from '@nestjs/common';

export interface MockVTuber {
  id: string;
  channelName: string;
  description: string;
  avatarUrl?: string;
  subscriberCount: number;
  isVerified: boolean;
  status: 'active' | 'graduated' | 'hiatus' | 'suspended';
  tags?: string[];
  createdAt: Date;
}

export interface MockGacha {
  id: string;
  name: string;
  description: string;
  vtuberId: string;
  price: number;
  medalReward: number;
  status: 'active' | 'inactive' | 'ended';
  startDate: Date;
  endDate?: Date;
  maxDraws?: number;
  totalDraws: number;
  items: MockGachaItem[];
}

export interface MockGachaItem {
  id: string;
  gachaId: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  dropRate: number;
  estimatedValue: number;
}

@Injectable()
export class VTuberMockService {
  private mockVTubers: MockVTuber[] = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      channelName: 'Hoshino Luna',
      description: '人気Vtuberのホシノルナです！歌とゲーム配信をメインに活動しています。',
      avatarUrl: 'https://example.com/avatars/luna.jpg',
      subscriberCount: 125000,
      isVerified: true,
      status: 'active',
      tags: ['歌', 'ゲーム', 'ASMR'],
      createdAt: new Date('2023-01-15'),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      channelName: 'Sakura Miko',
      description: 'エリート巫女のさくらみこです！面白い配信を心がけています！',
      avatarUrl: 'https://example.com/avatars/miko.jpg',
      subscriberCount: 89000,
      isVerified: true,
      status: 'active',
      tags: ['ゲーム', 'トーク', '企画'],
      createdAt: new Date('2023-03-20'),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      channelName: 'Amano Pikamee',
      description: 'でんきねずみVtuberのピカミィです！楽しく元気に配信中！',
      avatarUrl: 'https://example.com/avatars/pikamee.jpg',
      subscriberCount: 56000,
      isVerified: false,
      status: 'active',
      tags: ['雑談', 'ゲーム', '歌'],
      createdAt: new Date('2023-06-01'),
    },
  ];

  private mockGachas: MockGacha[] = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      name: 'ホシノルナ 1st Anniversary ガチャ',
      description: 'デビュー1周年記念！限定メダルが手に入るスペシャルガチャ！',
      vtuberId: 'a0000000-0000-0000-0000-000000000001',
      price: 300,
      medalReward: 30,
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      maxDraws: 100,
      totalDraws: 1250,
      items: [],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      name: 'さくらみこ Birthday ガチャ',
      description: 'みこちの誕生日を祝おう！限定ボイスメダル登場！',
      vtuberId: 'a0000000-0000-0000-0000-000000000002',
      price: 500,
      medalReward: 50,
      status: 'active',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-03-31'),
      maxDraws: 50,
      totalDraws: 895,
      items: [],
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      name: 'ピカミィ サマーフェスガチャ',
      description: '夏限定！水着衣装のメダルが手に入る！',
      vtuberId: 'a0000000-0000-0000-0000-000000000003',
      price: 200,
      medalReward: 20,
      status: 'ended',
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-08-31'),
      totalDraws: 2340,
      items: [],
    },
  ];

  private mockGachaItems: MockGachaItem[] = [
    // Luna's items
    { id: 'c001', gachaId: 'b0000000-0000-0000-0000-000000000001', name: 'ルナ 通常メダル', description: '通常のルナちゃんメダル', rarity: 'N', dropRate: 60.0, estimatedValue: 10 },
    { id: 'c002', gachaId: 'b0000000-0000-0000-0000-000000000001', name: 'ルナ レアボイスメダル', description: 'レアボイス付きメダル', rarity: 'R', dropRate: 30.0, estimatedValue: 50 },
    { id: 'c003', gachaId: 'b0000000-0000-0000-0000-000000000001', name: 'ルナ 限定衣装メダル', description: '1周年限定衣装メダル', rarity: 'SR', dropRate: 8.0, estimatedValue: 200 },
    { id: 'c004', gachaId: 'b0000000-0000-0000-0000-000000000001', name: 'ルナ サイン入りメダル', description: '直筆サイン入りSSRメダル', rarity: 'SSR', dropRate: 2.0, estimatedValue: 1000 },
    
    // Miko's items
    { id: 'c005', gachaId: 'b0000000-0000-0000-0000-000000000002', name: 'みこ 通常メダル', description: 'エリート巫女メダル', rarity: 'N', dropRate: 55.0, estimatedValue: 10 },
    { id: 'c006', gachaId: 'b0000000-0000-0000-0000-000000000002', name: 'みこ FAQ大全メダル', description: 'FAQ集録メダル', rarity: 'R', dropRate: 32.0, estimatedValue: 50 },
    { id: 'c007', gachaId: 'b0000000-0000-0000-0000-000000000002', name: 'みこ 誕生日限定メダル', description: '誕生日限定デザイン', rarity: 'SR', dropRate: 10.0, estimatedValue: 300 },
    { id: 'c008', gachaId: 'b0000000-0000-0000-0000-000000000002', name: 'みこ プレミアムメダル', description: 'プレミアム限定メダル', rarity: 'SSR', dropRate: 3.0, estimatedValue: 1500 },
    
    // Pikamee's items
    { id: 'c009', gachaId: 'b0000000-0000-0000-0000-000000000003', name: 'ピカミィ 通常メダル', description: '元気いっぱいメダル', rarity: 'N', dropRate: 65.0, estimatedValue: 10 },
    { id: 'c010', gachaId: 'b0000000-0000-0000-0000-000000000003', name: 'ピカミィ サマーメダル', description: '夏限定メダル', rarity: 'R', dropRate: 25.0, estimatedValue: 50 },
    { id: 'c011', gachaId: 'b0000000-0000-0000-0000-000000000003', name: 'ピカミィ 水着メダル', description: '水着衣装メダル', rarity: 'SR', dropRate: 7.0, estimatedValue: 250 },
    { id: 'c012', gachaId: 'b0000000-0000-0000-0000-000000000003', name: 'ピカミィ 花火メダル', description: '花火大会限定SSR', rarity: 'SSR', dropRate: 3.0, estimatedValue: 1200 },
  ];

  constructor() {
    // Associate items with gachas
    this.mockGachas.forEach(gacha => {
      gacha.items = this.mockGachaItems.filter(item => item.gachaId === gacha.id);
    });
  }

  async findAllVTubers(query: any = {}) {
    const { page = 1, limit = 10, status, isVerified } = query;
    let filtered = this.mockVTubers;

    if (status) {
      filtered = filtered.filter(v => v.status === status);
    }

    if (isVerified !== undefined) {
      filtered = filtered.filter(v => v.isVerified === isVerified);
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const vtubers = filtered.slice(start, end);

    return {
      vtubers,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  async findOneVTuber(id: string) {
    const vtuber = this.mockVTubers.find(v => v.id === id);
    if (!vtuber) {
      throw new Error(`VTuber with ID ${id} not found`);
    }

    const gachas = this.mockGachas.filter(g => g.vtuberId === id);
    
    return {
      ...vtuber,
      gachas,
    };
  }

  async getPopularVTubers(limit: number = 10) {
    return this.mockVTubers
      .sort((a, b) => b.subscriberCount - a.subscriberCount)
      .slice(0, limit);
  }

  async getActiveGachasByVTuber(vtuberId: string) {
    return this.mockGachas.filter(g => 
      g.vtuberId === vtuberId && g.status === 'active'
    );
  }

  async findAllGachas(query: any = {}) {
    const { page = 1, limit = 10, vtuberId, status } = query;
    let filtered = this.mockGachas;

    if (vtuberId) {
      filtered = filtered.filter(g => g.vtuberId === vtuberId);
    }

    if (status) {
      filtered = filtered.filter(g => g.status === status);
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const gachas = filtered.slice(start, end);

    // Add VTuber info to each gacha
    const gachasWithVTuber = gachas.map(gacha => ({
      ...gacha,
      vtuber: this.mockVTubers.find(v => v.id === gacha.vtuberId),
    }));

    return {
      gacha: gachasWithVTuber,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    };
  }

  async findOneGacha(id: string) {
    const gacha = this.mockGachas.find(g => g.id === id);
    if (!gacha) {
      throw new Error(`Gacha with ID ${id} not found`);
    }

    return {
      ...gacha,
      vtuber: this.mockVTubers.find(v => v.id === gacha.vtuberId),
    };
  }
}