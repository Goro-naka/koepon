import { Injectable } from '@nestjs/common'

export interface MedalBalance {
  totalMedals: number
  availableMedals: number
  lockedMedals: number
}

@Injectable()
export class MedalService {
  
  async earnMedals(
    userId: string,
    amount: number,
    source: 'gacha' | 'bonus'
  ): Promise<void> {
    // TODO: データベースでメダル残高を更新
    console.log(`User ${userId} earned ${amount} medals from ${source}`)
  }

  async getMedalBalance(userId: string): Promise<MedalBalance> {
    // TODO: データベースからメダル残高を取得
    return {
      totalMedals: 1000,
      availableMedals: 1000,
      lockedMedals: 0
    }
  }

  async exchangeMedals(
    userId: string,
    itemId: string,
    cost: number
  ): Promise<void> {
    const balance = await this.getMedalBalance(userId)
    
    if (balance.availableMedals < cost) {
      throw new Error('メダル残高が不足しています')
    }

    // TODO: データベースでメダル残高を減らしてアイテムを付与
    console.log(`User ${userId} exchanged ${cost} medals for item ${itemId}`)
  }
}