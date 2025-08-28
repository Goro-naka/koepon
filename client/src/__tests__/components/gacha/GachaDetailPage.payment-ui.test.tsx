/**
 * TASK-507: 決済フロー修正 - UI コンポーネントテスト
 * 
 * ガチャ詳細ページの価格表示とボタン表示の修正をテスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GachaDetailPage } from '@/components/gacha/GachaDetailPage'

// ストアのモック
const mockGachaStore = {
  executeDraw: jest.fn(),
  drawState: 'idle',
  drawResult: null,
  drawError: null
}

const mockMedalStore = {
  medalBalance: {
    availableMedals: 1000
  }
}

jest.mock('@/stores/gacha', () => ({
  useGachaStore: () => mockGachaStore
}))

jest.mock('@/stores/medal', () => ({
  useMedalStore: () => mockMedalStore
}))

// ガチャデータのモック
const mockGacha = {
  id: 'gacha_001',
  name: 'テストガチャ',
  description: 'テスト用のガチャです',
  singlePrice: 100, // 円（メダルではない）
  tenDrawPrice: 1000, // 円（メダルではない）
  isActive: true
}

jest.mock('@/hooks/useGacha', () => ({
  useGacha: () => ({
    gacha: mockGacha,
    loading: false,
    error: null
  })
}))

describe('TASK-507: GachaDetailPage - 価格表示修正', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TC-F006: 価格表示修正', () => {
    it('単発ガチャの価格を¥100で表示すること', () => {
      // When: ガチャ詳細ページをレンダリング
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: ¥100の価格表示がある
      expect(screen.getByText('¥100')).toBeInTheDocument()
      
      // メダル表示がない
      expect(screen.queryByText(/メダル/)).not.toBeInTheDocument()
      expect(screen.queryByText('100メダル')).not.toBeInTheDocument()
    })
    
    it('10連ガチャの価格を¥1,000で表示すること', () => {
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: ¥1,000の価格表示がある
      expect(screen.getByText('¥1,000')).toBeInTheDocument()
      
      // メダル表示がない
      expect(screen.queryByText('1000メダル')).not.toBeInTheDocument()
    })
  })

  describe('TC-F007: 購入ボタン表示修正', () => {
    it('単発購入ボタンに円価格が表示されること', () => {
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: 円価格での購入ボタンがある
      expect(screen.getByRole('button', { name: '¥100で購入' })).toBeInTheDocument()
      
      // メダルでの購入ボタンがない
      expect(screen.queryByRole('button', { name: /メダルで購入/ })).not.toBeInTheDocument()
    })
    
    it('10連購入ボタンに円価格が表示されること', () => {
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: 10連の円価格での購入ボタンがある
      expect(screen.getByRole('button', { name: '¥1,000で10連購入' })).toBeInTheDocument()
    })

    it('購入ボタンクリック時に直接決済処理が呼ばれること', async () => {
      render(<GachaDetailPage gachaId="gacha_001" />)

      // When: 単発購入ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: '¥100で購入' }))

      // Then: executeDraw が直接呼ばれる（メダルチェックなし）
      await waitFor(() => {
        expect(mockGachaStore.executeDraw).toHaveBeenCalledWith('gacha_001', 1)
      })
    })
  })

  describe('TC-F008: メダル残高チェック削除', () => {
    it('メダル残高不足でも購入ボタンが有効であること', () => {
      // Given: メダル残高0
      mockMedalStore.medalBalance.availableMedals = 0
      
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: 購入ボタンは無効化されない（メダルチェックなし）
      const buyButton = screen.getByRole('button', { name: '¥100で購入' })
      expect(buyButton).not.toBeDisabled()
    })

    it('メダル残高不足の警告メッセージが表示されないこと', () => {
      // Given: メダル残高0
      mockMedalStore.medalBalance.availableMedals = 0
      
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: メダル不足の警告がない
      expect(screen.queryByText(/メダルが不足/)).not.toBeInTheDocument()
      expect(screen.queryByText(/残高が不足/)).not.toBeInTheDocument()
    })
  })

  describe('TC-F009: 決済状態表示', () => {
    it('決済処理中に適切な状態が表示されること', () => {
      // Given: 決済処理中状態
      mockGachaStore.drawState = 'payment'
      
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: 決済処理中の表示
      expect(screen.getByText(/決済処理中/)).toBeInTheDocument()
    })

    it('抽選処理中に適切な状態が表示されること', () => {
      // Given: 抽選処理中状態
      mockGachaStore.drawState = 'drawing'
      
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: 抽選処理中の表示
      expect(screen.getByText(/抽選中/)).toBeInTheDocument()
    })
  })

  describe('TC-F010: 結果表示でのメダル獲得情報', () => {
    it('ガチャ結果にメダル獲得情報が表示されること', () => {
      // Given: ガチャ結果あり
      mockGachaStore.drawResult = {
        id: 'draw_123',
        items: [{ id: 'item_1', name: 'テストアイテム', rarity: 'SR' }],
        medalsEarned: 150,
        paymentAmount: 1000,
        timestamp: new Date().toISOString()
      }
      mockGachaStore.drawState = 'complete'
      
      render(<GachaDetailPage gachaId="gacha_001" />)

      // Then: メダル獲得情報が表示される
      expect(screen.getByText('150メダル獲得')).toBeInTheDocument()
      expect(screen.getByText('¥1,000')).toBeInTheDocument()
    })
  })
})