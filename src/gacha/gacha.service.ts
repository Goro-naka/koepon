import { Injectable } from '@nestjs/common'
import { PaymentService } from '@/payment/payment.service'
import { MedalService } from '@/medal/medal.service'

export interface DrawResult {
  id: string
  gachaId: string
  items: DrawResultItem[]
  medalsEarned: number
  paymentId: string
  paymentAmount: number
  drawCount: number
  timestamp: string
}

export interface DrawResultItem {
  id: string
  name: string
  rarity: 'N' | 'R' | 'SR' | 'SSR' | 'UR'
  description?: string
}

@Injectable()
export class GachaService {
  constructor(
    private gachaRepository: any,
    private paymentService: PaymentService,
    private medalService: MedalService
  ) {}

  async executeDraw(
    gachaId: string,
    count: number,
    paymentIntentId: string
  ): Promise<DrawResult> {
    // 重複決済チェック
    const existingDraw = await this.gachaRepository.findDrawByPaymentIntent?.(paymentIntentId)
    if (existingDraw) {
      throw new Error('この決済は既に使用済みです')
    }

    // 1. 決済確認
    const isPaymentConfirmed = await this.paymentService.confirmPayment(paymentIntentId)
    if (!isPaymentConfirmed) {
      throw new Error('決済が確認できません')
    }

    // 2. ガチャ情報取得
    const gacha = await this.gachaRepository.findById(gachaId)
    if (!gacha || !gacha.isActive) {
      throw new Error('ガチャが見つからないか、無効です')
    }

    // 3. 抽選実行
    const items = await this.gachaRepository.executeGachaLogic(gachaId, count)

    // 4. メダル付与計算
    const paymentAmount = count === 1 ? 100 : 1000
    const medalsEarned = Math.floor(paymentAmount / 10) + (count === 10 ? 50 : 0)

    // 5. メダル付与
    await this.medalService.earnMedals('current_user_id', medalsEarned, 'gacha')

    // 6. 抽選結果を作成
    const drawResult: DrawResult = {
      id: `draw_${Date.now()}`,
      gachaId,
      items,
      medalsEarned,
      paymentId: paymentIntentId,
      paymentAmount,
      drawCount: count,
      timestamp: new Date().toISOString()
    }

    // 7. 結果をデータベースに保存
    await this.gachaRepository.createDrawRecord?.(drawResult)

    return drawResult
  }
}