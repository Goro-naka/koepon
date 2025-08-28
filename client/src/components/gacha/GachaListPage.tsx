'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useGachaStore } from '@/stores/gacha'
import { Button } from '@/components/ui/button'
import { GachaCard } from './GachaCard'
import { FilterPanel } from './FilterPanel'
import { getUniqueVTubers, filterGachaItems } from '@/lib/gacha-utils'

function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden animate-pulse">
          {/* Header skeleton */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-slate-200 rounded-full mr-3"></div>
              <div className="w-20 h-4 bg-slate-200 rounded"></div>
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="p-4">
            <div className="w-3/4 h-6 bg-slate-200 rounded-xl mb-3"></div>
            <div className="w-full h-4 bg-slate-200 rounded mb-2"></div>
            <div className="w-2/3 h-4 bg-slate-200 rounded mb-4"></div>
            
            <div className="flex justify-between items-center mb-4">
              <div className="w-16 h-8 bg-slate-200 rounded-xl"></div>
              <div className="w-12 h-6 bg-slate-200 rounded-full"></div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="w-16 h-3 bg-slate-200 rounded"></div>
              <div className="w-20 h-3 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div data-testid="empty-state" className="text-center py-16">
      <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center shadow-lg">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-slate-300 rounded-lg"></div>
        </div>
      </div>
      <h3 className="text-2xl font-light text-slate-800 mb-4">ガチャが登録されていません</h3>
      <p className="text-slate-600 leading-relaxed">新しいガチャが追加されるまでお待ちください</p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center shadow-lg">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <div className="text-red-500 text-2xl">!</div>
        </div>
      </div>
      <h3 className="text-2xl font-light text-slate-800 mb-4">エラーが発生しました</h3>
      <p className="text-slate-600 mb-8 leading-relaxed">{error}</p>
      <Button 
        onClick={onRetry}
        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg"
      >
        再試行
      </Button>
    </div>
  )
}

export function GachaListPage() {
  const router = useRouter()
  const {
    gachaList,
    gachaListLoading,
    gachaListError,
    fetchGachaList,
    searchQuery,
    selectedVTuber,
    sortBy,
    setSearchQuery,
    setSelectedVTuber,
    setSortBy,
    clearFilters,
  } = useGachaStore()

  useEffect(() => {
    fetchGachaList()
  }, [fetchGachaList])

  const handleCardClick = (gachaId: string) => {
    router.push(`/gacha/${gachaId}`)
  }

  const handleRetry = () => {
    fetchGachaList()
  }

  const handleClearFilters = () => {
    clearFilters()
  }

  // Get unique VTubers for filter dropdown
  const availableVTubers = useMemo(() => getUniqueVTubers(gachaList), [gachaList])

  // Filter and sort gacha list
  const filteredGachaList = useMemo(() => {
    return filterGachaItems(gachaList, searchQuery, selectedVTuber, sortBy)
  }, [gachaList, searchQuery, selectedVTuber, sortBy])

  if (gachaListLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-light text-gray-900 mb-12 text-center tracking-wide">ガチャ一覧</h1>
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (gachaListError) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-light text-gray-900 mb-12 text-center tracking-wide">ガチャ一覧</h1>
          <ErrorState error={gachaListError} onRetry={handleRetry} />
        </div>
      </div>
    )
  }

  if (filteredGachaList.length === 0 && gachaList.length > 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-light text-gray-900 mb-12 text-center tracking-wide">ガチャ一覧</h1>
          <FilterPanel
            searchQuery={searchQuery}
            selectedVTuber={selectedVTuber}
            sortBy={sortBy}
            availableVTubers={availableVTubers}
            onSearchChange={setSearchQuery}
            onVTuberChange={setSelectedVTuber}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
          />
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <div className="text-slate-400 text-xl">?</div>
              </div>
            </div>
            <p className="text-slate-600 text-lg mb-6">検索条件に一致するガチャが見つかりません</p>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-medium"
            >
              フィルターをクリア
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (gachaList.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-light text-gray-900 mb-12 text-center tracking-wide">ガチャ一覧</h1>
          <EmptyState />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-light text-gray-900 mb-12 text-center tracking-wide">ガチャ一覧</h1>
        
        <div className="mb-8">
          <FilterPanel
            searchQuery={searchQuery}
            selectedVTuber={selectedVTuber}
            sortBy={sortBy}
            availableVTubers={availableVTubers}
            onSearchChange={setSearchQuery}
            onVTuberChange={setSelectedVTuber}
            onSortChange={setSortBy}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Results count */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-md border border-slate-100">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-800">
              {filteredGachaList.length}件のガチャが見つかりました
            </span>
          </div>
        </div>

        {/* Gacha Grid */}
        <div data-testid="gacha-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGachaList.map((gacha) => (
            <GachaCard
              key={gacha.id}
              gacha={gacha}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}