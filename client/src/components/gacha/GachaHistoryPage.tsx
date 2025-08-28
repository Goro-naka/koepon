'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGachaStore } from '@/stores/gacha'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function LoadingSkeleton() {
  return (
    <div data-testid="history-skeleton" className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex justify-between items-start mb-2">
            <div className="w-48 h-5 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-32 h-4 bg-gray-200 rounded mb-2"></div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  const router = useRouter()
  
  return (
    <div className="text-center py-16">
      <p className="text-gray-800 text-lg mb-6">抽選履歴がありません</p>
      <Button onClick={() => router.push('/gacha')}>
        ガチャを引いてみる
      </Button>
    </div>
  )
}

function HistoryItem({ 
  item, 
  expanded, 
  onToggleExpand, 
  onQuickAccess 
}: { 
  item: any
  expanded: boolean
  onToggleExpand: () => void
  onQuickAccess: (gachaId: string) => void
}) {
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const mainItem = item.items[0]
  const isMultiDraw = item.drawCount > 1

  return (
    <div data-testid={`history-item-${item.id}`} className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg">{item.gachaName}</h3>
          <p className="text-gray-800">{item.vtuberName}</p>
        </div>
        <div className="text-right text-sm text-gray-800">
          {formatDateTime(item.timestamp)}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          {!isMultiDraw ? (
            <div className="flex items-center">
              <img 
                src={mainItem.image} 
                alt={mainItem.name}
                className="w-12 h-12 object-cover rounded mr-3" 
              />
              <div>
                <p className="font-medium">{mainItem.name}</p>
                <p className="text-sm text-gray-800">{mainItem.rarity}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">10連ガチャ</span>
              <div className="flex space-x-1">
                {item.items.slice(0, 3).map((subItem: any, index: number) => (
                  <img 
                    key={index}
                    src={subItem.image} 
                    alt={subItem.name}
                    className="w-8 h-8 object-cover rounded" 
                  />
                ))}
                {item.items.length > 3 && (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                    +{item.items.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-right">
          <p className="font-semibold">{item.totalMedals}枚獲得</p>
          {isMultiDraw && (
            <p className="text-sm text-gray-800">{item.drawCount}回</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {isMultiDraw && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onToggleExpand}
            >
              {expanded ? '詳細を隠す' : '詳細を見る'}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onQuickAccess(item.gachaId)}
          >
            もう一度引く
          </Button>
        </div>
      </div>

      {expanded && isMultiDraw && (
        <div data-testid="expanded-items" className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-5 gap-3">
            {item.items.map((subItem: any, index: number) => (
              <div 
                key={subItem.id} 
                data-testid={`expanded-item-${index + 1}`}
                className="text-center"
              >
                <img 
                  src={subItem.image} 
                  alt={subItem.name}
                  className="w-16 h-16 object-cover rounded mx-auto mb-1" 
                />
                <p className="text-xs font-medium">{subItem.name}</p>
                <p className="text-xs text-gray-800">{subItem.rarity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatisticsPanel({ statistics }: { statistics?: any }) {
  if (!statistics) return null

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-800">総抽選回数</p>
        <p className="text-2xl font-bold text-blue-600">{statistics.totalDrawCount}回</p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-800">総獲得メダル数</p>
        <p className="text-2xl font-bold text-green-600">{statistics.totalMedalsEarned}枚</p>
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-800">レア排出率</p>
        <p className="text-2xl font-bold text-purple-600">{statistics.rareItemRate}%</p>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-800">お気に入りVTuber</p>
        <p className="text-lg font-bold text-yellow-600">{statistics.favoriteVTuber}</p>
      </div>
    </div>
  )
}

function Pagination({ pagination, onPageChange }: { pagination?: any; onPageChange: (page: number) => void }) {
  if (!pagination || pagination.totalPages <= 1) return null

  return (
    <div data-testid="pagination" className="flex justify-center items-center space-x-4 mt-8">
      <Button 
        variant="outline" 
        disabled={pagination.currentPage === 1}
        onClick={() => onPageChange(pagination.currentPage - 1)}
      >
        前のページ
      </Button>
      <span className="text-sm text-gray-800">
        {pagination.currentPage} / {pagination.totalPages}ページ
      </span>
      <Button 
        variant="outline" 
        disabled={pagination.currentPage === pagination.totalPages}
        onClick={() => onPageChange(pagination.currentPage + 1)}
      >
        次のページ
      </Button>
    </div>
  )
}

export function GachaHistoryPage() {
  const router = useRouter()
  const {
    drawHistory,
    drawHistoryLoading,
    drawHistoryError,
    fetchDrawHistory,
    historyFilters,
    setHistoryFilters,
    clearHistoryFilters,
    historyPagination,
    setHistoryPage,
    historyStatistics,
  } = useGachaStore()

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchDrawHistory()
  }, [fetchDrawHistory])

  const handleFilterChange = (key: keyof typeof historyFilters, value: string) => {
    setHistoryFilters({
      ...historyFilters,
      [key]: value
    })
  }

  const handleClearFilters = () => {
    clearHistoryFilters()
  }

  const handleToggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleQuickAccess = (gachaId: string) => {
    router.push(`/gacha/${gachaId}`)
  }

  const handlePageChange = (page: number) => {
    if (setHistoryPage) {
      setHistoryPage(page)
    }
  }

  if (drawHistoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">抽選履歴</h1>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">抽選履歴</h1>

      {/* Statistics */}
      <StatisticsPanel statistics={historyStatistics} />

      {/* Filters */}
      <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
        <div>
          <Label htmlFor="vtuber-filter">VTuber選択</Label>
          <Select 
            value={historyFilters.vtuber || "all"} 
            onValueChange={(value) => handleFilterChange('vtuber', value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="桜音ミク">桜音ミク</SelectItem>
              <SelectItem value="花音リン">花音リン</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="start-date">開始日</Label>
          <Input
            id="start-date"
            type="date"
            value={historyFilters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="end-date">終了日</Label>
          <Input
            id="end-date"
            type="date"
            value={historyFilters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="rarity-filter">レアリティ選択</Label>
          <Select 
            value={historyFilters.rarity || "all"} 
            onValueChange={(value) => handleFilterChange('rarity', value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="すべて" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="SR">SR以上</SelectItem>
              <SelectItem value="R">R以上</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" onClick={handleClearFilters}>
          フィルタークリア
        </Button>
      </div>

      {/* History List */}
      {drawHistory.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="space-y-4">
            {drawHistory.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                expanded={expandedItems.has(item.id)}
                onToggleExpand={() => handleToggleExpand(item.id)}
                onQuickAccess={handleQuickAccess}
              />
            ))}
          </div>

          <Pagination 
            pagination={historyPagination} 
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}