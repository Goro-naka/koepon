'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useGachaStore } from '@/stores/gacha'
import { useMedalStore } from '@/stores/medal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function GachaDrawContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { drawResult, drawState, clearDrawResult } = useGachaStore()
  const { earnMedals } = useMedalStore()
  
  const gachaId = searchParams.get('gachaId')
  const count = parseInt(searchParams.get('count') || '1')

  useEffect(() => {
    // ページ離脱時に結果をクリア
    return () => {
      clearDrawResult()
    }
  }, [clearDrawResult])

  useEffect(() => {
    // 抽選結果があってメダルが獲得された場合、メダル残高を更新
    if (drawResult?.medalsEarned && drawResult.medalsEarned > 0) {
      earnMedals(drawResult.medalsEarned, 'gacha')
    }
  }, [drawResult, earnMedals])

  // ローディング状態の表示
  if (drawState === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">決済処理中...</h2>
          <p className="text-gray-600">しばらくお待ちください</p>
        </div>
      </div>
    )
  }

  if (drawState === 'drawing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin mb-4">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">抽選中...</h2>
          <p className="text-gray-600">結果をお待ちください</p>
        </div>
      </div>
    )
  }

  // エラー状態の表示
  if (drawState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">申し訳ございません。もう一度お試しください。</p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex-1"
            >
              戻る
            </Button>
            <Link href="/gacha" className="flex-1">
              <Button className="w-full">
                ガチャ一覧へ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 抽選結果の表示
  if (drawState === 'complete' && drawResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">抽選結果</h1>
            <p className="text-gray-600">
              {count === 1 ? '単発' : '10連'}ガチャの結果です
            </p>
          </div>

          {/* 獲得アイテム */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">獲得アイテム</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {drawResult.results?.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 text-center">
                  <div className={`w-16 h-16 mx-auto mb-2 rounded-lg ${
                    item.rarity === 'UR' ? 'bg-gradient-to-br from-purple-400 to-pink-400' :
                    item.rarity === 'SSR' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                    item.rarity === 'SR' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' :
                    item.rarity === 'R' ? 'bg-gradient-to-br from-green-400 to-emerald-400' :
                    'bg-gray-300'
                  }`}></div>
                  <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    item.rarity === 'UR' ? 'bg-purple-100 text-purple-800' :
                    item.rarity === 'SSR' ? 'bg-yellow-100 text-yellow-800' :
                    item.rarity === 'SR' ? 'bg-blue-100 text-blue-800' :
                    item.rarity === 'R' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.rarity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* メダル獲得情報 */}
          {drawResult.medalsEarned > 0 && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">推しメダル獲得</h2>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {drawResult.medalsEarned.toLocaleString()}
                  </div>
                  <div className="text-gray-600">メダル獲得</div>
                </div>
              </div>
            </div>
          )}

          {/* 決済情報 */}
          <div className="bg-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">決済情報</h2>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">支払金額</span>
              <span className="font-bold text-lg">¥{drawResult.paymentAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4">
            <Link href={`/gacha/${gachaId}`} className="flex-1">
              <Button variant="outline" className="w-full">
                もう一度引く
              </Button>
            </Link>
            <Link href="/gacha" className="flex-1">
              <Button className="w-full">
                ガチャ一覧へ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // デフォルト表示（抽選結果がない場合）
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">抽選結果がありません</h2>
        <p className="text-gray-600 mb-6">ガチャを引いてから再度お試しください。</p>
        <Link href="/gacha">
          <Button className="w-full">
            ガチャ一覧へ
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function GachaDrawPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">読み込み中...</h2>
          <p className="text-gray-600">しばらくお待ちください</p>
        </div>
      </div>
    }>
      <GachaDrawContent />
    </Suspense>
  )
}