/**
 * TASK-507: 決済フロー修正 - メダルストアテスト
 * 
 * メダル購入機能の削除とガチャ結果からのメダル獲得機能をテスト
 */

import { renderHook, act } from '@testing-library/react'
import { useMedalStore } from '@/stores/medal'

describe('TASK-507: メダルストア - 購入機能削除', () => {
  beforeEach(() => {
    // ストアをリセット
    useMedalStore.setState({
      medalBalance: {
        totalMedals: 1000,
        availableMedals: 1000,
        lockedMedals: 0,
        vtuberBalances: [],
        lastUpdated: new Date().toISOString()
      }
    })
  })

  describe('TC-F004: メダル購入機能の削除確認', () => {
    it('purchaseMedals メソッドが存在しないこと', () => {
      const { result } = renderHook(() => useMedalStore())
      
      // Then: purchaseMedalsメソッドが存在しない
      expect((result.current as any).purchaseMedals).toBeUndefined()
    })
    
    it('useMedals メソッドが存在しないこと', () => {
      const { result } = renderHook(() => useMedalStore())
      
      // Then: useMedalsメソッドが存在しない
      expect((result.current as any).useMedals).toBeUndefined()
    })

    it('useMedalsForGacha メソッドが存在しないこと', () => {
      const { result } = renderHook(() => useMedalStore())
      
      // Then: useMedalsForGachaメソッドが存在しない
      expect((result.current as any).useMedalsForGacha).toBeUndefined()
    })
  })

  describe('TC-F005: earnMedals - ガチャ結果としてのメダル獲得', () => {
    it('ガチャ結果としてメダルを獲得できること', async () => {
      const { result } = renderHook(() => useMedalStore())
      
      // Given: 初期メダル残高 1000
      expect(result.current.medalBalance?.availableMedals).toBe(1000)

      // When: ガチャ結果として100メダル獲得
      await act(async () => {
        await result.current.earnMedals!(100, 'gacha')
      })

      // Then: メダル残高が1100に増加
      expect(result.current.medalBalance?.availableMedals).toBe(1100)
      expect(result.current.medalBalance?.totalMedals).toBe(1100)
    })

    it('ボーナスとしてメダルを獲得できること', async () => {
      const { result } = renderHook(() => useMedalStore())

      // When: ボーナスとして50メダル獲得
      await act(async () => {
        await result.current.earnMedals!(50, 'bonus')
      })

      // Then: メダル残高が増加
      expect(result.current.medalBalance?.availableMedals).toBe(1050)
    })
  })

  describe('TC-F006: exchangeMedals - メダル交換機能', () => {
    it('メダルでアイテムと交換できること', async () => {
      const { result } = renderHook(() => useMedalStore())

      // When: 200メダルでアイテム交換
      await act(async () => {
        await result.current.exchangeMedals!('item_123', 200)
      })

      // Then: メダル残高が減少
      expect(result.current.medalBalance?.availableMedals).toBe(800)
      expect(result.current.medalBalance?.totalMedals).toBe(800)
    })

    it('残高不足時にエラーが発生すること', async () => {
      const { result } = renderHook(() => useMedalStore())

      // When: 残高以上のメダルで交換を試行
      await expect(act(async () => {
        await result.current.exchangeMedals!('expensive_item', 2000)
      })).rejects.toThrow('メダル残高が不足しています')

      // Then: メダル残高は変化しない
      expect(result.current.medalBalance?.availableMedals).toBe(1000)
    })
  })
})