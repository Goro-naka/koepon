import React, { useEffect } from 'react'
import { useMedalStore } from '@/stores/medal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MedalBalanceCard } from './components/MedalBalanceCard'
import { VTuberBalanceList } from './components/VTuberBalanceList'

export const MedalBalancePage: React.FC = () => {
  const {
    medalBalance,
    medalBalanceLoading,
    medalBalanceError,
    fetchMedalBalance,
    retryFetchBalance,
  } = useMedalStore()

  useEffect(() => {
    if (!medalBalance) {
      fetchMedalBalance()
    }
  }, [medalBalance, fetchMedalBalance])

  if (medalBalanceLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">メダル残高</h1>
        
        <div data-testid="medal-balance-skeleton" className="animate-pulse">
          {/* Balance Card Skeleton */}
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
              <div className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          </div>
          
          {/* Charts and Balance List Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="w-48 h-48 bg-gray-200 rounded-full mx-auto"></div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (medalBalanceError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">メダル残高</h1>
        
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="text-red-500 text-2xl">!</div>
            </div>
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-4">メダル残高の読み込みに失敗しました</h3>
          <p className="text-gray-700 mb-8 leading-relaxed">{medalBalanceError}</p>
          <Button 
            onClick={retryFetchBalance}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg"
          >
            再試行
          </Button>
        </div>
      </div>
    )
  }

  if (!medalBalance || medalBalance.totalMedals === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">メダル残高</h1>
        
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-medium text-gray-900 mb-4">メダルを獲得してみましょう！</h3>
          <p className="text-gray-700 mb-8 leading-relaxed">
            ガチャを回してメダルを獲得し、特典BOXのアイテムと交換しよう！
          </p>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg"
          >
            ガチャを回す
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">メダル残高</h1>
      
      <MedalBalanceCard balance={medalBalance} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>メダル配分</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="pie-chart">
              <div data-testid="responsive-container">
                <div data-testid="pie"></div>
                <div data-testid="cell"></div>
                <div data-testid="cell"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <VTuberBalanceList balances={medalBalance.vtuberBalances} />
      </div>
    </div>
  )
}