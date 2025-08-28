import React, { useEffect, useState } from 'react'
import { useExchangeStore } from '@/stores/exchange'
import { useMedalStore } from '@/stores/medal'
import { formatMedalAmountWithUnit } from '@/lib/medal-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ExchangeItemGrid } from './components/ExchangeItemGrid'

export const ExchangePage: React.FC = () => {
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const {
    exchangeItems,
    exchangeItemsLoading,
    exchangeItemsError,
    searchQuery,
    itemFilters,
    sortBy,
    executeExchange,
    fetchExchangeItems,
    setSearchQuery,
    setItemFilters,
    setSortBy,
    validateExchangeRequirements,
  } = useExchangeStore()

  const {
    medalBalance,
    checkSufficientBalance,
  } = useMedalStore()

  useEffect(() => {
    if (exchangeItems.length === 0) {
      fetchExchangeItems()
    }
  }, [exchangeItems.length, fetchExchangeItems])

  if (exchangeItemsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">アイテム交換所</h1>
        
        <div data-testid="exchange-items-skeleton" className="animate-pulse">
          {/* Search and Filter Skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-40 h-10 bg-gray-200 rounded"></div>
          </div>
          
          {/* Category Filter Skeleton */}
          <div className="flex gap-2 flex-wrap mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          
          {/* Items Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (exchangeItemsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">アイテム交換所</h1>
        
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="text-red-500 text-2xl">!</div>
            </div>
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-4">読み込みに失敗しました</h3>
          <p className="text-gray-700 mb-8 leading-relaxed">{exchangeItemsError}</p>
          <Button 
            onClick={fetchExchangeItems}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg"
          >
            再試行
          </Button>
        </div>
      </div>
    )
  }

  const handleExchangeClick = (itemId: string) => {
    setSelectedItem(itemId)
    setShowExchangeModal(true)
  }

  const handleConfirmExchange = async () => {
    if (!selectedItem) return
    
    await executeExchange(selectedItem, 1)
    setShowExchangeModal(false)
    setSelectedItem(null)
  }

  const selectedItemData = exchangeItems.find(item => item.id === selectedItem)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">アイテム交換所</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="アイテムを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">新着順</SelectItem>
            <SelectItem value="cost">価格順</SelectItem>
            <SelectItem value="name">名前順</SelectItem>
            <SelectItem value="popular">人気順</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={itemFilters.category === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setItemFilters({ category: '' })}
        >
          すべて
        </Button>
        <Button
          variant={itemFilters.category === 'voice' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setItemFilters({ category: 'voice' })}
        >
          ボイス
        </Button>
        <Button
          variant={itemFilters.category === 'goods' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setItemFilters({ category: 'goods' })}
        >
          グッズ
        </Button>
        <Button
          variant={itemFilters.category === 'special' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setItemFilters({ category: 'special' })}
        >
          特典
        </Button>
        <Button
          variant={itemFilters.category === 'limited' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setItemFilters({ category: 'limited' })}
        >
          限定
        </Button>
      </div>

      {/* Exchange Items Grid */}
      <ExchangeItemGrid
        items={exchangeItems}
        onExchangeClick={handleExchangeClick}
        checkSufficientBalance={checkSufficientBalance}
      />

      {/* Exchange Confirmation Modal */}
      <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>交換確認</DialogTitle>
            {selectedItemData && (
              <DialogDescription>
                <div className="space-y-2">
                  <div>{selectedItemData.name}を交換しますか？</div>
                  <div>必要メダル: {formatMedalAmountWithUnit(selectedItemData.cost)}</div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExchangeModal(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleConfirmExchange}>
              交換実行
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}