'use client'

import { Container } from "@/components/layout/container"
import { Header } from "@/components/layout/header"
import { GachaCard } from "@/components/gacha/GachaCard"
import { Button } from "@/components/ui/button"
import { VTuberAvatar } from "@/components/ui/vtuber-avatar"
import { ExchangeItemGrid } from "@/components/medal/components/ExchangeItemGrid"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useGachaStore } from "@/stores/gacha"
import { useMedalStore } from "@/stores/medal"
import { useExchangeStore } from "@/stores/exchange"
import { formatMedalAmountWithUnit } from "@/lib/medal-utils"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

export default function VTuberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { gachaList, fetchGachaList } = useGachaStore()
  const { 
    medalBalance, 
    getMedalBalanceByVtuber, 
    checkSufficientBalanceForVtuber,
    exchangeMedals,
    fetchMedalBalance
  } = useMedalStore()
  const { 
    exchangeItems, 
    fetchExchangeItems 
  } = useExchangeStore()
  
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  
  const vtuberName = decodeURIComponent(params.name as string)

  useEffect(() => {
    fetchGachaList()
    fetchMedalBalance()
    fetchExchangeItems()
  }, [fetchGachaList, fetchMedalBalance, fetchExchangeItems])

  // そのVTuberのガチャだけを抽出
  const vtuberGachas = useMemo(() => {
    return gachaList
      .filter(gacha => gacha.vtuberName === vtuberName)
      .sort((a, b) => (a.popularityRank || 999) - (b.popularityRank || 999))
  }, [gachaList, vtuberName])

  // そのVTuberの交換アイテムだけを抽出
  const vtuberExchangeItems = useMemo(() => {
    return exchangeItems.filter(item => item.vtuberName === vtuberName)
  }, [exchangeItems, vtuberName])

  // VTuberのメダル残高
  const vtuberMedalBalance = useMemo(() => {
    return getMedalBalanceByVtuber(vtuberName)
  }, [getMedalBalanceByVtuber, vtuberName])

  // VTuber情報を取得
  const vtuberInfo = useMemo(() => {
    if (vtuberGachas.length === 0) return null
    
    const totalParticipants = vtuberGachas.reduce((sum, gacha) => sum + (gacha.totalDraws || 0), 0)
    const activeGachas = vtuberGachas.filter(gacha => gacha.isActive).length
    const limitedGachas = vtuberGachas.filter(gacha => gacha.isLimitedTime).length
    
    return {
      name: vtuberName,
      avatar: vtuberGachas[0].vtuberAvatar,
      totalGachas: vtuberGachas.length,
      totalParticipants,
      activeGachas,
      limitedGachas,
      isPopular: vtuberGachas.some(g => (g.popularityRank || 999) <= 3)
    }
  }, [vtuberGachas, vtuberName])

  const handleGachaClick = (gachaId: string) => {
    router.push(`/gacha/${gachaId}`)
  }

  const handleBackClick = () => {
    router.push('/vtubers')
  }

  const handleExchangeClick = (itemId: string) => {
    setSelectedItem(itemId)
    setShowExchangeModal(true)
  }

  const handleConfirmExchange = async () => {
    if (!selectedItem) return
    
    const item = vtuberExchangeItems.find(item => item.id === selectedItem)
    if (!item) return
    
    try {
      await exchangeMedals(selectedItem, item.cost, vtuberName)
      setShowExchangeModal(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Exchange failed:', error)
      // エラーハンドリングは後で実装
    }
  }

  if (!vtuberInfo) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <section className="py-12 sm:py-20">
            <Container>
              <div className="text-center py-16">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">VTuberが見つかりません</h1>
                <p className="text-gray-700 mb-8">指定されたVTuberは存在しないか、ガチャがまだ公開されていません。</p>
                <Button onClick={handleBackClick}>
                  VTuber一覧に戻る
                </Button>
              </div>
            </Container>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* VTuber Profile Section */}
        <section className="py-12 bg-gradient-to-r from-gray-50 to-white">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative">
                  <VTuberAvatar
                    vtuberName={vtuberInfo.name}
                    width={160}
                    height={160}
                    className="w-32 h-32 md:w-40 md:h-40 shadow-xl ring-4 ring-white"
                  />
                  {vtuberInfo.isPopular && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm px-3 py-1 rounded-full font-medium shadow-lg">
                        人気VTuber
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {vtuberInfo.name}
                  </h1>
                  <p className="text-gray-800 text-lg mb-6">
                    {vtuberInfo.name}の特別なガチャとコンテンツをお楽しみください
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="text-2xl font-bold text-blue-600">{vtuberInfo.totalGachas}</div>
                      <div className="text-sm text-gray-700">総ガチャ数</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="text-2xl font-bold text-green-600">{vtuberInfo.activeGachas}</div>
                      <div className="text-sm text-gray-700">開催中</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="text-2xl font-bold text-red-600">{vtuberInfo.limitedGachas}</div>
                      <div className="text-sm text-gray-700">期間限定</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="text-2xl font-bold text-purple-600">{vtuberInfo.totalParticipants.toLocaleString()}</div>
                      <div className="text-sm text-gray-700">総参加者数</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Gachas Section */}
        <section className="py-12 sm:py-20">
          <Container>
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {vtuberInfo.name}のガチャ一覧
                </h2>
                <Button variant="outline" onClick={handleBackClick}>
                  VTuber一覧に戻る
                </Button>
              </div>
              <p className="text-gray-800">
                {vtuberInfo.name}が提供する全てのガチャを探索してみましょう
              </p>
            </div>

            {vtuberGachas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vtuberGachas.map((gacha) => (
                  <GachaCard
                    key={gacha.id}
                    gacha={gacha}
                    onClick={handleGachaClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <div className="text-gray-400 text-xl">🎰</div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg mb-4">まだガチャがありません</p>
                <p className="text-gray-700">新しいガチャの追加をお待ちください</p>
              </div>
            )}

            {vtuberGachas.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/gacha">全てのガチャを見る</Link>
                </Button>
              </div>
            )}
          </Container>
        </section>

        {/* Exchange Section */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-white to-gray-50">
          <Container>
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {vtuberInfo.name}のアイテム交換所
                </h2>
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-sm text-gray-600">保有メダル</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {vtuberMedalBalance.toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="text-gray-800">
                {vtuberInfo.name}の特別なアイテムをメダルで交換しよう
              </p>
            </div>

            {vtuberExchangeItems.length > 0 ? (
              <ExchangeItemGrid
                items={vtuberExchangeItems}
                onExchangeClick={handleExchangeClick}
                checkSufficientBalance={(amount) => checkSufficientBalanceForVtuber(vtuberName, amount)}
              />
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <div className="text-purple-400 text-xl">🎁</div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg mb-4">まだ交換アイテムがありません</p>
                <p className="text-gray-700">新しいアイテムの追加をお待ちください</p>
              </div>
            )}

            {vtuberExchangeItems.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" asChild>
                  <Link href="/exchange">全ての交換所を見る</Link>
                </Button>
              </div>
            )}
          </Container>
        </section>

        {/* Exchange Confirmation Modal */}
        <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>交換確認</DialogTitle>
              {selectedItem && vtuberExchangeItems.find(item => item.id === selectedItem) && (
                <DialogDescription>
                  <div className="space-y-3">
                    <div>{vtuberExchangeItems.find(item => item.id === selectedItem)?.name}を交換しますか？</div>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>VTuber:</span>
                        <span className="font-semibold">{vtuberName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>必要メダル:</span>
                        <span className="font-bold text-red-600">
                          {formatMedalAmountWithUnit(vtuberExchangeItems.find(item => item.id === selectedItem)?.cost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>保有メダル:</span>
                        <span className="font-bold text-blue-600">
                          {formatMedalAmountWithUnit(vtuberMedalBalance)}
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
      </main>
    </div>
  )
}