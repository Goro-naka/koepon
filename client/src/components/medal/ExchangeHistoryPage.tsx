import React, { useEffect } from 'react'
import { useExchangeStore } from '@/stores/exchange'
import { formatMedalAmountWithUnit, getExchangeStatusName, formatDateTime } from '@/lib/medal-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const ExchangeHistoryPage: React.FC = () => {
  const {
    exchangeHistory,
    exchangeHistoryLoading,
    exchangeHistoryError,
    exchangeStatistics,
    historyFilters,
    fetchExchangeHistory,
    setHistoryFilters,
  } = useExchangeStore()

  useEffect(() => {
    if (exchangeHistory.length === 0) {
      fetchExchangeHistory()
    }
  }, [exchangeHistory.length, fetchExchangeHistory])

  if (exchangeHistoryLoading) {
    return (
      <div data-testid="exchange-history-skeleton" className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (exchangeHistoryError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{exchangeHistoryError}</p>
        <Button onClick={fetchExchangeHistory}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">交換履歴</h1>

      {/* Statistics */}
      {exchangeStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">総交換回数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{exchangeStatistics.totalExchanges}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">使用メダル総数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMedalAmountWithUnit(exchangeStatistics.totalMedalsUsed)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">今月の交換回数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{exchangeStatistics.thisMonthExchanges}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">人気VTuber</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{exchangeStatistics.mostPopularVtuber}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={historyFilters.status === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHistoryFilters({ status: '' })}
        >
          すべて
        </Button>
        <Button
          variant={historyFilters.status === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHistoryFilters({ status: 'completed' })}
        >
          完了
        </Button>
        <Button
          variant={historyFilters.status === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHistoryFilters({ status: 'pending' })}
        >
          処理中
        </Button>
        <Button
          variant={historyFilters.status === 'failed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setHistoryFilters({ status: 'failed' })}
        >
          失敗
        </Button>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {exchangeHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">交換履歴がありません</p>
          </div>
        ) : (
          exchangeHistory.map((history) => (
            <Card key={history.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <img
                      src={history.itemImageUrl}
                      alt={history.itemName}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-item.jpg'
                      }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{history.itemName}</h3>
                    <p className="text-sm text-gray-600">{history.vtuberName}</p>
                    <p className="text-sm">
                      {formatDateTime(history.createdAt)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold">{formatMedalAmountWithUnit(history.totalCost)}</p>
                    <p className="text-sm">数量: {history.quantity}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      history.status === 'completed' ? 'bg-green-100 text-green-800' :
                      history.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getExchangeStatusName(history.status)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}