/**
 * TASK-507: 決済フロー修正 - GachaService テスト
 * 
 * 決済確認後の抽選実行とメダル付与ロジックをテスト
 */

import { GachaService } from '@/gacha/gacha.service'
import { PaymentService } from '@/payment/payment.service'
import { MedalService } from '@/medal/medal.service'

// モック
const mockPaymentService = {
  confirmPayment: jest.fn(),
  createPaymentIntent: jest.fn()
}

const mockMedalService = {
  earnMedals: jest.fn(),
  getMedalBalance: jest.fn()
}

const mockGachaRepository = {
  findById: jest.fn(),
  createDrawRecord: jest.fn(),
  executeGachaLogic: jest.fn()
}

jest.mock('@/payment/payment.service')
jest.mock('@/medal/medal.service')

describe('TASK-507: GachaService - 決済フロー修正', () => {
  let gachaService: GachaService
  
  beforeEach(() => {
    jest.clearAllMocks()
    gachaService = new GachaService(
      mockGachaRepository as any,
      mockPaymentService as any,
      mockMedalService as any
    )
  })

  describe('TC-B003: executeDraw - 決済確認後の抽選実行', () => {
    it('決済確認後にガチャ抽選が実行されること', async () => {
      // Given: 確認済みPaymentIntent
      const gachaId = 'gacha_001'
      const count = 1
      const paymentIntentId = 'pi_confirmed_123'
      
      mockPaymentService.confirmPayment.mockResolvedValue(true)
      mockGachaRepository.findById.mockResolvedValue({
        id: gachaId,
        name: 'テストガチャ',
        isActive: true
      })
      mockGachaRepository.executeGachaLogic.mockResolvedValue([
        { id: 'item_1', name: 'テストアイテム', rarity: 'SR' }
      ])
      mockMedalService.earnMedals.mockResolvedValue(undefined)

      // When: ガチャ抽選実行
      const result = await gachaService.executeDraw(gachaId, count, paymentIntentId)

      // Then: 決済確認が呼ばれる
      expect(mockPaymentService.confirmPayment).toHaveBeenCalledWith(paymentIntentId)

      // 抽選結果が返される
      expect(result.id).toBeDefined()
      expect(result.items).toHaveLength(1)
      expect(result.medalsEarned).toBeGreaterThan(0)
      expect(result.paymentId).toBe(paymentIntentId)
      expect(result.paymentAmount).toBe(100) // 単発は100円

      // メダル付与が呼ばれる
      expect(mockMedalService.earnMedals).toHaveBeenCalledWith(
        expect.any(String), // userId
        expect.any(Number), // medalAmount
        'gacha'
      )
    })

    it('10連ガチャでは1000円の決済金額が記録されること', async () => {
      // Given: 10連ガチャの設定
      const gachaId = 'gacha_001'
      const count = 10
      const paymentIntentId = 'pi_confirmed_456'
      
      mockPaymentService.confirmPayment.mockResolvedValue(true)
      mockGachaRepository.findById.mockResolvedValue({
        id: gachaId,
        name: 'テストガチャ',
        isActive: true
      })
      mockGachaRepository.executeGachaLogic.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({ 
          id: `item_${i}`, 
          name: `アイテム${i}`, 
          rarity: 'N' 
        }))
      )

      // When: 10連ガチャ実行
      const result = await gachaService.executeDraw(gachaId, count, paymentIntentId)

      // Then: 10連の価格が記録される
      expect(result.paymentAmount).toBe(1000)
      expect(result.items).toHaveLength(10)
    })
  })

  describe('TC-B004: executeDraw - 未確認決済での抽選拒否', () => {
    it('未確認のPaymentIntentでは抽選が実行されないこと', async () => {
      // Given: 未確認PaymentIntent
      const paymentIntentId = 'pi_unconfirmed_123'
      mockPaymentService.confirmPayment.mockResolvedValue(false)

      // When/Then: 抽選実行が拒否される
      await expect(
        gachaService.executeDraw('gacha_001', 1, paymentIntentId)
      ).rejects.toThrow('決済が確認できません')

      // ガチャロジックが呼ばれない
      expect(mockGachaRepository.executeGachaLogic).not.toHaveBeenCalled()
      expect(mockMedalService.earnMedals).not.toHaveBeenCalled()
    })
  })

  describe('TC-B005: executeDraw - メダル消費ロジック削除', () => {
    it('メダル残高チェックが行われないこと', async () => {
      // Given: 決済確認済み
      mockPaymentService.confirmPayment.mockResolvedValue(true)
      mockGachaRepository.findById.mockResolvedValue({
        id: 'gacha_001',
        name: 'テストガチャ',
        isActive: true
      })
      mockGachaRepository.executeGachaLogic.mockResolvedValue([
        { id: 'item_1', name: 'テストアイテム' }
      ])

      // When: ガチャ実行
      await gachaService.executeDraw('gacha_001', 1, 'pi_test_123')

      // Then: メダル残高取得が呼ばれない
      expect(mockMedalService.getMedalBalance).not.toHaveBeenCalled()
    })

    it('DrawResult に medalUsed が含まれないこと', async () => {
      // Given: 正常なガチャ実行設定
      mockPaymentService.confirmPayment.mockResolvedValue(true)
      mockGachaRepository.findById.mockResolvedValue({
        id: 'gacha_001',
        isActive: true
      })
      mockGachaRepository.executeGachaLogic.mockResolvedValue([
        { id: 'item_1', name: 'テストアイテム' }
      ])

      // When: ガチャ実行
      const result = await gachaService.executeDraw('gacha_001', 1, 'pi_test_123')

      // Then: medalUsed プロパティが存在しない
      expect((result as any).medalUsed).toBeUndefined()
      expect(result.medalsEarned).toBeDefined()
      expect(result.paymentId).toBeDefined()
      expect(result.paymentAmount).toBeDefined()
    })
  })

  describe('TC-B006: executeDraw - 重複決済防止', () => {
    it('同一PaymentIntentで重複抽選が防止されること', async () => {
      const paymentIntentId = 'pi_test_123'
      
      // Given: 既に使用済みのPaymentIntent
      mockGachaRepository.findDrawByPaymentIntent = jest.fn().mockResolvedValue({
        id: 'existing_draw',
        paymentIntentId
      })

      // When/Then: 重複実行が拒否される
      await expect(
        gachaService.executeDraw('gacha_001', 1, paymentIntentId)
      ).rejects.toThrow('この決済は既に使用済みです')
    })
  })
})