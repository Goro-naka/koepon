'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGachaStore } from '@/stores/gacha'
import { Button } from '@/components/ui/button'
import { VTuberAvatar } from '@/components/ui/vtuber-avatar'
import { ItemImage } from '@/components/ui/item-image'

function LoadingSkeleton() {
  return (
    <div data-testid="gacha-detail-skeleton" className="animate-pulse">
      <div className="w-3/4 h-8 bg-gray-200 rounded mb-4"></div>
      <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
      <div className="w-2/3 h-4 bg-gray-200 rounded mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
          <div className="w-full h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="w-1/2 h-6 bg-gray-200 rounded"></div>
          <div className="w-full h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  const router = useRouter()
  
  return (
    <div className="text-center py-12">
      <p className="text-red-600 text-lg mb-4">{error}</p>
      <Button onClick={() => router.push('/gacha')}>一覧に戻る</Button>
    </div>
  )
}

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  price, 
  count 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  price: number
  count: number
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        role="dialog"
        aria-labelledby="confirmation-title"
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h2 id="confirmation-title" className="text-xl font-bold mb-4">確認</h2>
        <p className="text-gray-700 mb-6">
          ¥{price.toLocaleString()}でガチャを引きますか？
          {count === 10 && ' (10連)'}
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            キャンセル
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            実行
          </Button>
        </div>
      </div>
    </div>
  )
}

export function GachaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const gachaId = params.id as string
  
  const {
    selectedGacha,
    selectedGachaLoading,
    selectedGachaError,
    fetchGachaDetail,
    executeDraw,
    drawState,
  } = useGachaStore()

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedDrawType, setSelectedDrawType] = useState<{ count: number; price: number } | null>(null)

  useEffect(() => {
    if (gachaId) {
      fetchGachaDetail(gachaId)
    }
  }, [gachaId, fetchGachaDetail])

  const handleDrawClick = (count: number, price: number) => {
    setSelectedDrawType({ count, price })
    setShowConfirmModal(true)
  }

  const handleConfirmDraw = async () => {
    if (selectedDrawType && selectedGacha) {
      setShowConfirmModal(false)
      
      // 先にページ遷移してから抽選実行（UX改善）
      router.push(`/gacha/draw?gachaId=${selectedGacha.id}&count=${selectedDrawType.count}`)
      
      // 抽選実行
      await executeDraw(selectedGacha.id, selectedDrawType.count)
    }
  }

  const handleCloseModal = () => {
    setShowConfirmModal(false)
    setSelectedDrawType(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (selectedGachaLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton />
      </div>
    )
  }

  if (selectedGachaError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState error={selectedGachaError} />
      </div>
    )
  }

  if (!selectedGacha) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState error="ガチャが見つかりません" />
      </div>
    )
  }

  const isExpired = selectedGacha.isExpired || (selectedGacha.endDate && new Date(selectedGacha.endDate) < new Date())
  const discountPercentage = Math.round(((selectedGacha.singlePrice * 10 - selectedGacha.tenDrawPrice) / (selectedGacha.singlePrice * 10)) * 100)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <VTuberAvatar
            vtuberName={selectedGacha.vtuberName}
            size="md"
            className="mr-4"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{selectedGacha.title || selectedGacha.name}</h1>
            <p className="text-gray-800">{selectedGacha.vtuberName}</p>
          </div>
        </div>
        
        {selectedGacha.isLimitedTime && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded mr-3">
                期間限定
              </span>
              {selectedGacha.startDate && selectedGacha.availableUntil && (
                <span className="text-sm text-gray-800">
                  {formatDate(selectedGacha.startDate)} - {formatDate(selectedGacha.availableUntil)}
                </span>
              )}
            </div>
            {selectedGacha.remainingCount !== undefined && (
              <p className="text-sm text-gray-800 mt-2">
                残り回数: {selectedGacha.remainingCount}回
              </p>
            )}
          </div>
        )}

        {isExpired && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <span className="text-gray-800 font-medium">終了済み</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Description and Details */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-900">ガチャ概要</h2>
            <p className="text-gray-900 whitespace-pre-line">{selectedGacha.description}</p>
          </div>

          {/* Probability Rates */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-900">排出率</h2>
            <div className="overflow-hidden border rounded-lg">
              <table role="table" aria-label="排出率" className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-900">レアリティ</th>
                    <th className="px-4 py-2 text-left text-gray-900">確率</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGacha.probabilityRates?.map((rate, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 text-gray-900">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2" 
                            style={{ backgroundColor: rate.color }}
                          />
                          {rate.rarity}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-900">{rate.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Available Rewards */}
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-900">景品一覧</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedGacha.availableRewards?.map((reward) => (
                <div key={reward.id} className="border rounded-lg p-4">
                  <ItemImage
                    itemId={reward.id}
                    itemName={reward.name}
                    width={300}
                    height={128}
                    className="w-full h-32 rounded mb-2"
                  />
                  <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                  <p className="text-sm text-gray-800">{reward.rarity}</p>
                  {reward.description && (
                    <p className="text-xs text-gray-800 mt-1">{reward.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Purchase Options */}
        <div className="space-y-6">
          {/* Payment/Drawing Status */}
          {drawState === 'payment' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">決済処理中...</p>
            </div>
          )}
          {drawState === 'drawing' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">抽選中...</p>
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-bold mb-3 text-gray-900">価格情報</h2>
            
            {/* Single Draw */}
            <div className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">単発ガチャ</h3>
                <span className="text-xl font-bold">¥{selectedGacha.singlePrice.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-800 mb-3">1回分のガチャを引けます</p>
              <Button
                className="w-full"
                disabled={isExpired || drawState === 'drawing' || drawState === 'payment'}
                onClick={() => handleDrawClick(1, selectedGacha.singlePrice)}
              >
                ¥{selectedGacha.singlePrice}で購入
              </Button>
            </div>

            {/* 10-Draw */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">10連ガチャ</h3>
                <div className="text-right">
                  <span className="text-xl font-bold">¥{selectedGacha.tenDrawPrice.toLocaleString()}</span>
                  <div className="text-sm text-green-600">{discountPercentage}% OFF</div>
                </div>
              </div>
              <p className="text-sm text-gray-800 mb-3">10回分のガチャを一度に引けます</p>
              <Button
                className="w-full"
                disabled={isExpired || drawState === 'drawing' || drawState === 'payment'}
                onClick={() => handleDrawClick(10, selectedGacha.tenDrawPrice)}
              >
                ¥{selectedGacha.tenDrawPrice}で10連購入
              </Button>
            </div>
          </div>

        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDraw}
        price={selectedDrawType?.price || 0}
        count={selectedDrawType?.count || 1}
      />
    </div>
  )
}