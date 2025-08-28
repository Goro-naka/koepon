'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGachaStore } from '@/stores/gacha'
import { Button } from '@/components/ui/button'

function DrawAnimation({ progress }: { progress: number }) {
  return (
    <div data-testid="draw-animation" className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Main animation container */}
        <div className="relative mb-12">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-purple-100 animate-pulse opacity-60"></div>
          
          {/* Main orb */}
          <div className="relative w-48 h-48 mx-auto rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 animate-pulse"></div>
            
            {/* Rotating rings */}
            <div className="absolute inset-4 border-2 border-slate-200 rounded-full animate-spin opacity-30"></div>
            <div className="absolute inset-8 border border-slate-300 rounded-full animate-spin-reverse opacity-20" style={{ animationDuration: '3s' }}></div>
            
            {/* Center content */}
            <div className="relative z-10 text-slate-600">
              <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
              <div className="text-sm font-medium tracking-wide">Drawing...</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-light text-slate-800 mb-8 tracking-wide">
          抽選中
        </h2>

        {/* Progress bar */}
        <div className="w-80 mx-auto bg-slate-100 rounded-full h-1 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-slate-500 font-medium">
          {progress}%
        </div>
      </div>
    </div>
  )
}

function MultiDrawAnimation({ progress, currentDraw }: { progress: number; currentDraw: number }) {
  return (
    <div data-testid="multi-draw-animation" className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        {/* Main animation container */}
        <div className="relative mb-12">
          {/* Outer glow ring */}
          <div className="absolute inset-0 w-56 h-56 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-purple-100 animate-pulse opacity-60"></div>
          
          {/* Main orb */}
          <div className="relative w-56 h-56 mx-auto rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50 animate-pulse"></div>
            
            {/* Multiple rotating rings for 10-draw */}
            <div className="absolute inset-4 border-2 border-slate-200 rounded-full animate-spin opacity-40"></div>
            <div className="absolute inset-8 border-2 border-slate-300 rounded-full animate-spin-reverse opacity-30" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-12 border border-slate-200 rounded-full animate-spin opacity-20" style={{ animationDuration: '4s' }}></div>
            
            {/* Center content */}
            <div className="relative z-10 text-slate-700">
              <div className="text-3xl font-light mb-2">
                {currentDraw}
              </div>
              <div className="text-lg text-slate-400 mb-3">/</div>
              <div className="text-2xl font-medium">10</div>
              <div className="text-xs font-medium tracking-wider text-slate-500 mt-2">
                DRAWING
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-light text-slate-800 mb-8 tracking-wide">
          10連抽選中
        </h2>

        {/* Individual draw indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < currentDraw
                  ? 'bg-gradient-to-r from-blue-400 to-purple-400'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-80 mx-auto bg-slate-100 rounded-full h-1 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function DrawResult({ result }: { result: any }) {
  const router = useRouter()

  if (result.drawCount === 1) {
    const item = result.items[0]
    const rarityConfig = {
      'UR': { 
        bg: 'from-amber-400 via-yellow-300 to-amber-500', 
        border: 'border-amber-400',
        glow: 'shadow-amber-200',
        text: 'text-amber-600'
      },
      'SSR': { 
        bg: 'from-purple-400 via-pink-300 to-purple-500', 
        border: 'border-purple-400',
        glow: 'shadow-purple-200',
        text: 'text-purple-600'
      },
      'SR': { 
        bg: 'from-blue-400 via-cyan-300 to-blue-500', 
        border: 'border-blue-400',
        glow: 'shadow-blue-200',
        text: 'text-blue-600'
      },
      'R': { 
        bg: 'from-green-400 via-emerald-300 to-green-500', 
        border: 'border-green-400',
        glow: 'shadow-green-200',
        text: 'text-green-600'
      },
      'N': { 
        bg: 'from-slate-300 via-gray-200 to-slate-300', 
        border: 'border-slate-300',
        glow: 'shadow-slate-200',
        text: 'text-slate-600'
      }
    }
    const config = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig['N']
    
    return (
      <div data-testid="draw-result" className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg text-center">
          {/* Main result container */}
          <div className="relative mb-8">
            {/* Glow effect */}
            <div className={`absolute inset-0 w-72 h-72 mx-auto rounded-3xl bg-gradient-to-br ${config.bg} opacity-20 blur-xl`}></div>
            
            {/* Item showcase */}
            <div className={`relative w-72 h-72 mx-auto rounded-3xl bg-white ${config.border} border-2 ${config.glow} shadow-2xl flex items-center justify-center overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white opacity-80"></div>
              
              {/* Item image */}
              <img 
                src={item.image} 
                alt={item.name}
                className="relative z-10 w-56 h-56 object-cover rounded-2xl shadow-lg" 
              />
              
              {/* Rarity indicator */}
              <div className={`absolute top-4 right-4 px-3 py-1 bg-gradient-to-r ${config.bg} text-white text-sm font-medium rounded-full shadow-lg`}>
                {item.rarity}
              </div>
            </div>
          </div>

          {/* Item details */}
          <div data-testid={`rarity-${item.rarity.toLowerCase()}`} className="mb-8">
            <h2 className="text-4xl font-light text-slate-800 mb-3 tracking-wide">{item.name}</h2>
            <div className={`text-lg font-medium ${config.text} mb-4`}>{item.rarity} レア</div>
            {item.description && (
              <p className="text-slate-600 text-base leading-relaxed max-w-md mx-auto">{item.description}</p>
            )}
          </div>

          {/* Medal reward */}
          <div data-testid="medal-count" className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8 inline-block shadow-lg">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <span className="text-2xl font-medium text-amber-700">{result.totalMedals}枚獲得</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="space-y-4">
            {['SR', 'SSR', 'UR'].includes(item.rarity) && (
              <Button 
                variant="outline" 
                className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 rounded-xl font-medium"
              >
                結果をシェア
              </Button>
            )}
            
            <div>
              <Button 
                onClick={() => router.push('/gacha')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
              >
                ガチャ一覧に戻る
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Multi-draw result
  const bestItem = result.items.reduce((best: any, item: any) => {
    const rarityOrder = { 'N': 0, 'R': 1, 'SR': 2, 'SSR': 3, 'UR': 4 }
    return (rarityOrder[item.rarity as keyof typeof rarityOrder] || 0) > 
           (rarityOrder[best.rarity as keyof typeof rarityOrder] || 0) ? item : best
  }, result.items[0])

  const rarityConfig = {
    'UR': { 
      bg: 'from-amber-400 via-yellow-300 to-amber-500', 
      border: 'border-amber-400',
      glow: 'shadow-amber-200',
      text: 'text-amber-600'
    },
    'SSR': { 
      bg: 'from-purple-400 via-pink-300 to-purple-500', 
      border: 'border-purple-400',
      glow: 'shadow-purple-200',
      text: 'text-purple-600'
    },
    'SR': { 
      bg: 'from-blue-400 via-cyan-300 to-blue-500', 
      border: 'border-blue-400',
      glow: 'shadow-blue-200',
      text: 'text-blue-600'
    },
    'R': { 
      bg: 'from-green-400 via-emerald-300 to-green-500', 
      border: 'border-green-400',
      glow: 'shadow-green-200',
      text: 'text-green-600'
    },
    'N': { 
      bg: 'from-slate-300 via-gray-200 to-slate-300', 
      border: 'border-slate-300',
      glow: 'shadow-slate-200',
      text: 'text-slate-600'
    }
  }

  return (
    <div data-testid="multi-draw-result" className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-light text-slate-800 text-center mb-12 tracking-wide">10連ガチャ結果</h2>
        
        {/* Best Result Highlight */}
        <div className="text-center mb-12">
          <h3 className="text-lg font-medium text-slate-600 mb-6 tracking-wide">最高レア</h3>
          <div 
            data-testid={`best-result-item-${bestItem.id}`}
            className="relative w-40 h-40 mx-auto"
          >
            {/* Glow effect for best item */}
            <div className={`absolute inset-0 bg-gradient-to-br ${rarityConfig[bestItem.rarity as keyof typeof rarityConfig]?.bg || rarityConfig['N'].bg} opacity-30 blur-xl rounded-2xl`}></div>
            
            <div className={`relative w-40 h-40 rounded-2xl bg-white border-2 ${rarityConfig[bestItem.rarity as keyof typeof rarityConfig]?.border || rarityConfig['N'].border} shadow-xl overflow-hidden`}>
              <img 
                src={bestItem.image} 
                alt={bestItem.name}
                className="w-full h-28 object-cover" 
              />
              <div className="p-2">
                <p className="text-xs font-medium text-slate-800 truncate">{bestItem.name}</p>
                <p className={`text-xs font-medium ${rarityConfig[bestItem.rarity as keyof typeof rarityConfig]?.text || rarityConfig['N'].text}`}>
                  {bestItem.rarity}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All Results Grid */}
        <div className="grid grid-cols-5 gap-4 mb-12">
          {result.items.map((item: any, index: number) => {
            const config = rarityConfig[item.rarity as keyof typeof rarityConfig] || rarityConfig['N']
            return (
              <div key={item.id} data-testid={`result-item-${index + 1}`} className="text-center">
                <div className={`w-full aspect-square rounded-xl bg-white border ${config.border} shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300`}>
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-2/3 object-cover" 
                  />
                  <div className="p-2">
                    <p className="text-xs font-medium text-slate-800 truncate">{item.name}</p>
                    <p className={`text-xs ${config.text}`}>{item.rarity}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Medal reward */}
        <div data-testid="medal-count" className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8 text-center shadow-lg max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </div>
            <span className="text-3xl font-medium text-amber-700">合計 {result.totalMedals}枚獲得</span>
          </div>
        </div>
        
        <div className="text-center">
          <Button 
            onClick={() => router.push('/gacha')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
          >
            ガチャ一覧に戻る
          </Button>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ error, onRetry, onHome }: { error: string; onRetry?: () => void; onHome: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        {/* Error icon */}
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <div className="text-red-500 text-2xl">!</div>
          </div>
        </div>

        <h2 className="text-3xl font-light text-slate-800 mb-4 tracking-wide">エラーが発生しました</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">{error}</p>
        
        <div className="space-y-3">
          {onRetry && (
            <Button 
              onClick={onRetry}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg"
            >
              再試行
            </Button>
          )}
          
          
          <Button 
            variant="outline" 
            onClick={onHome}
            className="w-full bg-white border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl font-medium"
          >
            {error.includes('サーバーエラー') ? 'ホームに戻る' : 'ガチャ一覧に戻る'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function GachaDrawPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gachaId = searchParams.get('gachaId')
  const count = parseInt(searchParams.get('count') || '1')

  const {
    drawState,
    drawResult,
    drawError,
    drawProgress = 0,
    multiDrawProgress = 0,
    executeDraw,
    clearDrawResult,
    retryDraw,
  } = useGachaStore()

  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    if (gachaId && !drawResult) {
      executeDraw(gachaId, count)
    }
  }, [gachaId, count, drawResult, executeDraw])

  useEffect(() => {
    return () => {
      clearDrawResult()
    }
  }, [clearDrawResult])

  // Simulate animation progress
  useEffect(() => {
    if (drawState === 'drawing') {
      const interval = setInterval(() => {
        setAnimationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 2
        })
      }, 60) // Complete in ~3 seconds
      
      return () => clearInterval(interval)
    }
  }, [drawState])

  const handleRetry = () => {
    if (retryDraw) {
      setAnimationProgress(0)
      retryDraw()
    }
  }

  const handleGoHome = () => {
    router.push('/gacha')
  }

  if (drawState === 'error' && drawError) {
    return (
      <ErrorState 
        error={drawError} 
        onRetry={drawError.includes('ネットワーク') ? handleRetry : undefined}
        onHome={handleGoHome}
      />
    )
  }

  if (drawState === 'complete' && drawResult) {
    return <DrawResult result={drawResult} />
  }

  if (drawState === 'drawing') {
    return count === 10 ? (
      <MultiDrawAnimation 
        progress={animationProgress} 
        currentDraw={multiDrawProgress || 1} 
      />
    ) : (
      <DrawAnimation progress={animationProgress} />
    )
  }

  // Initial loading state
  return <DrawAnimation progress={0} />
}