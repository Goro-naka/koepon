import React, { useEffect, useState } from 'react'
import { useExchangeStore } from '@/stores/exchange'
import { useMedalStore } from '@/stores/medal'
import { formatMedalAmountWithUnit } from '@/lib/medal-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [selectedVtuber, setSelectedVtuber] = useState<string>('星月ひな')

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
    checkSufficientBalanceForVtuber,
    getMedalBalanceByVtuber,
    exchangeMedals,
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
    if (!selectedItem || !selectedItemData) return
    
    try {
      await exchangeMedals(selectedItem, selectedItemData.cost, selectedVtuber)
      setShowExchangeModal(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Exchange failed:', error)
      // エラーハンドリングは後で実装
    }
  }

  const selectedItemData = exchangeItems.find(item => item.id === selectedItem)

  const vtubers = medalBalance?.vtuberBalances || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">アイテム交換所</h1>

      {/* VTuber選択タブ */}
      <Tabs value={selectedVtuber} onValueChange={setSelectedVtuber} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {vtubers.map((vtuber) => (
            <TabsTrigger key={vtuber.vtuberName} value={vtuber.vtuberName}>
              {vtuber.vtuberName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {vtubers.map((vtuber) => (
          <TabsContent key={vtuber.vtuberName} value={vtuber.vtuberName} className="space-y-6">
            {/* VTuber別メダル残高表示 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {vtuber.vtuberName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{vtuber.vtuberName}</h3>
                    <p className="text-sm text-gray-600">のアイテム交換所</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">保有メダル</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {vtuber.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

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
              items={exchangeItems.filter(item => item.vtuberName === vtuber.vtuberName)}
              onExchangeClick={handleExchangeClick}
              checkSufficientBalance={(amount) => checkSufficientBalanceForVtuber(vtuber.vtuberName, amount)}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Exchange Confirmation Modal */}
      <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>交換確認</DialogTitle>
            {selectedItemData && (
              <DialogDescription>
                <div className="space-y-3">
                  <div>{selectedItemData.name}を交換しますか？</div>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>VTuber:</span>
                      <span className="font-semibold">{selectedVtuber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>必要メダル:</span>
                      <span className="font-bold text-red-600">
                        {formatMedalAmountWithUnit(selectedItemData.cost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>保有メダル:</span>
                      <span className="font-bold text-blue-600">
                        {formatMedalAmountWithUnit(getMedalBalanceByVtuber(selectedVtuber))}
                      </span>
                    </div>
                  </div>
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