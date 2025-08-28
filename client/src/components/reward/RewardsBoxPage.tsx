import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRewardsStore } from '@/stores/rewards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFileSize, filterRewards, sortRewards } from '@/lib/reward-utils'
import type { Reward, RewardCategory } from '@/types/reward'

const CATEGORY_FILTERS: Array<{ key: RewardCategory | '', label: string }> = [
  { key: '', label: 'すべて' },
  { key: 'voice', label: 'ボイス' },
  { key: 'image', label: '画像' },
  { key: 'video', label: '動画' },
  { key: 'document', label: 'その他' },
]

const SKELETON_CARDS = Array.from({ length: 8 }, (_, i) => i + 1)

export const RewardsBoxPage: React.FC = () => {
  const [selectedRewards, setSelectedRewards] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewReward, setPreviewReward] = useState<Reward | null>(null)

  const {
    rewards,
    rewardsLoading,
    rewardsError,
    searchQuery,
    filters,
    sortBy,
    fetchRewards,
    downloadReward,
    downloadMultiple,
    setSearchQuery,
    setFilters,
    toggleFavorite,
  } = useRewardsStore()

  // Memoized filtered and sorted rewards
  const filteredAndSortedRewards = useMemo(() => {
    const filtered = filterRewards(rewards, searchQuery, filters)
    return sortRewards(filtered, sortBy)
  }, [rewards, searchQuery, filters, sortBy])

  useEffect(() => {
    if (rewards.length === 0 && !rewardsLoading) {
      fetchRewards()
    }
  }, [rewards.length, rewardsLoading, fetchRewards])

  const handleRewardClick = useCallback((reward: Reward) => {
    setPreviewReward(reward)
    setShowPreview(true)
  }, [])

  const handleDownload = useCallback((rewardId: string) => {
    downloadReward(rewardId)
  }, [downloadReward])

  const handleBatchDownload = useCallback(() => {
    if (selectedRewards.length > 0) {
      downloadMultiple(selectedRewards)
      setSelectedRewards([])
    }
  }, [selectedRewards, downloadMultiple])

  const toggleRewardSelection = useCallback((rewardId: string) => {
    setSelectedRewards(prev =>
      prev.includes(rewardId)
        ? prev.filter(id => id !== rewardId)
        : [...prev, rewardId]
    )
  }, [])

  const handleCategoryFilter = useCallback((category: RewardCategory | '') => {
    setFilters({ category })
  }, [setFilters])

  const handleClosePreview = useCallback(() => {
    setShowPreview(false)
    setPreviewReward(null)
  }, [])

  if (rewardsLoading) {
    return (
      <div className="space-y-4">
        <div data-testid="rewards-skeleton" className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {SKELETON_CARDS.map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (rewardsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{rewardsError}</p>
        <Button onClick={fetchRewards}>再試行</Button>
      </div>
    )
  }

  if (filteredAndSortedRewards.length === 0 && rewards.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">特典がありません</h2>
        <p className="text-gray-800">ガチャで特典を獲得しましょう！</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">特典BOX</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="特典を検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        {selectedRewards.length > 0 && (
          <Button onClick={handleBatchDownload}>
            一括ダウンロード ({selectedRewards.length})
          </Button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filters.category === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedRewards.map((reward) => (
          <Card 
            key={reward.id} 
            className="reward-card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleRewardClick(reward)}
          >
            <div className="aspect-video bg-gray-100 relative">
              <img
                src={reward.thumbnailUrl}
                alt={reward.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-reward.jpg'
                }}
              />
              
              <input
                type="checkbox"
                className="absolute top-2 left-2 z-10"
                checked={selectedRewards.includes(reward.id)}
                onChange={() => toggleRewardSelection(reward.id)}
                onClick={(e) => e.stopPropagation()}
              />
              
              {reward.isFavorite && (
                <span className="absolute top-2 right-2 text-yellow-500">⭐</span>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{reward.title}</CardTitle>
              <p className="text-sm text-gray-800">{reward.vtuberName}</p>
            </CardHeader>
            
            <CardContent>
              <p className="text-xs text-gray-800 mb-2">{reward.description}</p>
              
              <div className="flex justify-between items-center text-sm">
                <span>{formatFileSize(reward.fileSize)}</span>
                <span className="text-xs">
                  {reward.isDownloaded ? 'ダウンロード済み' : '未ダウンロード'}
                </span>
              </div>
              
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(reward.id)
                }}
              >
                ダウンロード
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && previewReward && (
        <div 
          data-testid="reward-preview-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleClosePreview}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{previewReward.title}</h2>
            <img
              src={previewReward.thumbnailUrl}
              alt={previewReward.title}
              className="w-full mb-4"
            />
            <p className="mb-4">{previewReward.description}</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClosePreview}>
                閉じる
              </Button>
              <Button onClick={() => handleDownload(previewReward.id)}>
                ダウンロード
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}