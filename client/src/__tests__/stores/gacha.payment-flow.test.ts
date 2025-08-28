/**
 * TASK-507: 決済フロー修正 - ガチャストアテスト
 * 
 * これらのテストは最初は失敗します（TDD Red phase）
 * 正しい実装後に成功するようになります
 */

import { renderHook, act } from '@testing-library/react'
import { useGachaStore } from '@/stores/gacha'

// Stripe決済のモック
const mockProcessStripePayment = jest.fn()
const mockApiClient = {
  post: jest.fn()
}

jest.mock('@/api/client', () => ({
  apiClient: mockApiClient
}))

jest.mock('@/lib/stripe', () => ({
  processStripePayment: mockProcessStripePayment
}))

describe('TASK-507: ガチャストア - 決済フロー修正', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // ストアをリセット
    useGachaStore.setState({
      drawState: 'idle',
      drawResult: null,
      drawError: null
    })
  })

  describe('TC-F001: executeDraw - 単発ガチャ直接決済', () => {
    it('100円で単発ガチャを購入できること', async () => {
      // Given: 正常な決済とガチャAPIレスポンス
      mockProcessStripePayment.mockResolvedValue({
        success: true,
        id: 'pi_test_123'
      })
      
      mockApiClient.post.mockResolvedValue({
        data: {
          id: 'draw_123',
          items: [{ id: 'item_1', name: 'テストアイテム' }],
          medalsEarned: 50,
          paymentAmount: 100,
          timestamp: new Date().toISOString()
        }
      })

      const { result } = renderHook(() => useGachaStore())

      // When: 単発ガチャを実行
      await act(async () => {
        await result.current.executeDraw('gacha_001', 1)
      })

      // Then: Stripe決済が100円で呼び出される
      expect(mockProcessStripePayment).toHaveBeenCalledWith({
        amount: 100,
        currency: 'jpy',
        description: expect.stringContaining('単発'),
        metadata: {
          gachaId: 'gacha_001',
          count: 1,
          userId: expect.any(String)
        }
      })

      // ガチャAPIが決済IDと共に呼び出される
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/gacha/draw', {
        gachaId: 'gacha_001',
        count: 1,
        paymentIntentId: 'pi_test_123'
      })

      // 結果が正しく設定される
      expect(result.current.drawResult?.paymentAmount).toBe(100)
      expect(result.current.drawResult?.medalsEarned).toBe(50)
      expect(result.current.drawState).toBe('complete')
    })
  })

  describe('TC-F002: executeDraw - 10連ガチャ直接決済', () => {
    it('1000円で10連ガチャを購入できること', async () => {
      // Given: 10連ガチャの設定
      mockProcessStripePayment.mockResolvedValue({
        success: true,
        id: 'pi_test_456'
      })
      
      mockApiClient.post.mockResolvedValue({
        data: {
          id: 'draw_456',
          items: Array.from({ length: 10 }, (_, i) => ({ 
            id: `item_${i}`, 
            name: `アイテム${i}` 
          })),
          medalsEarned: 150,
          paymentAmount: 1000,
          timestamp: new Date().toISOString()
        }
      })

      const { result } = renderHook(() => useGachaStore())

      // When: 10連ガチャを実行
      await act(async () => {
        await result.current.executeDraw('gacha_001', 10)
      })

      // Then: 1000円で決済処理
      expect(mockProcessStripePayment).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'jpy',
        description: expect.stringContaining('10連'),
        metadata: {
          gachaId: 'gacha_001',
          count: 10,
          userId: expect.any(String)
        }
      })

      expect(result.current.drawResult?.paymentAmount).toBe(1000)
      expect(result.current.drawResult?.items).toHaveLength(10)
    })
  })

  describe('TC-F003: executeDraw - 決済失敗時のエラーハンドリング', () => {
    it('決済失敗時に適切なエラーメッセージを表示すること', async () => {
      // Given: 決済が失敗する設定
      mockProcessStripePayment.mockResolvedValue({
        success: false,
        error: 'カードが拒否されました'
      })

      const { result } = renderHook(() => useGachaStore())

      // When: ガチャ実行を試行
      await act(async () => {
        await result.current.executeDraw('gacha_001', 1)
      })

      // Then: エラー状態になる
      expect(result.current.drawState).toBe('error')
      expect(result.current.drawError).toBe('決済に失敗しました')
      
      // ガチャAPIは呼び出されない
      expect(mockApiClient.post).not.toHaveBeenCalled()
    })
  })

  describe('TC-F004: メダル消費機能の削除確認', () => {
    it('medalUsed プロパティが存在しないこと', async () => {
      // Given: ガチャ実行後
      mockProcessStripePayment.mockResolvedValue({
        success: true,
        id: 'pi_test_789'
      })
      
      mockApiClient.post.mockResolvedValue({
        data: {
          id: 'draw_789',
          items: [{ id: 'item_1', name: 'テストアイテム' }],
          medalsEarned: 50,
          paymentAmount: 100,
          timestamp: new Date().toISOString()
          // medalUsed: undefined - 削除済み
        }
      })

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.executeDraw('gacha_001', 1)
      })

      // Then: medalUsedプロパティが存在しない
      expect(result.current.drawResult?.medalUsed).toBeUndefined()
      expect(result.current.drawResult?.medalsEarned).toBeDefined()
      expect(result.current.drawResult?.paymentAmount).toBeDefined()
    })
  })
})