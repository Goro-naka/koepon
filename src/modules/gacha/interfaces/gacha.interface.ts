export interface Gacha {
  id: string;
  vtuberId: string;
  name: string;
  description: string;
  imageUrl?: string;
  medalCost: number;
  status: 'active' | 'inactive' | 'ended';
  startDate: Date;
  endDate?: Date;
  maxDraws?: number;
  totalDraws: number;
  items: GachaItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GachaItem {
  id: string;
  gachaId: string;
  rewardId: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  dropRate: number;
  maxCount?: number;
  currentCount: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GachaResult {
  id: string;
  userId: string;
  gachaId: string;
  itemId: string;
  medalCost: number;
  timestamp: Date;
}

export interface DrawResult {
  results: GachaResult[];
  remainingMedals: number;
  executionTime: number;
}

export interface GachaListResponse {
  gacha: Gacha[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}