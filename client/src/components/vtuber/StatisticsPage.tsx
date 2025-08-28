import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVTuberStore } from '@/stores/vtuber'
import type { DateRange } from '@/types/vtuber'

const PRESET_RANGES: Array<{ key: string; label: string; range: DateRange }> = [
  {
    key: '7d',
    label: '過去7日間',
    range: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }
  },
  {
    key: '30d', 
    label: '過去30日間',
    range: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }
  },
  {
    key: '90d',
    label: '過去90日間', 
    range: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    }
  }
]

export const StatisticsPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<string>('30d')
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: PRESET_RANGES[1].range.startDate,
    endDate: PRESET_RANGES[1].range.endDate,
  })

  const {
    statisticsData,
    isLoading,
    error,
    fetchStatisticsData,
  } = useVTuberStore()

  const currentDateRange = useMemo(() => {
    const preset = PRESET_RANGES.find(r => r.key === selectedRange)
    return preset ? preset.range : customDateRange
  }, [selectedRange, customDateRange])

  useEffect(() => {
    fetchStatisticsData(currentDateRange)
  }, [fetchStatisticsData, currentDateRange])

  const handlePresetRangeChange = (rangeKey: string) => {
    setSelectedRange(rangeKey)
  }

  const handleCustomDateChange = (field: keyof DateRange, value: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }))
    setSelectedRange('custom')
  }

  const handleExportReport = async (format: 'csv' | 'excel') => {
    try {
      // In a real implementation, this would call an API endpoint
      alert(`${format.toUpperCase()}形式でレポートをエクスポートします（実装中）`)
    } catch (_error) {
      console.error("Error:", _error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => fetchStatisticsData(currentDateRange)}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">統計・分析</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportReport('csv')}
          >
            CSV出力
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportReport('excel')}
          >
            Excel出力
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">期間設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {PRESET_RANGES.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedRange === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetRangeChange(key)}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant={selectedRange === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRange('custom')}
              >
                カスタム
              </Button>
            </div>
            
            {selectedRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">開始日</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">終了日</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {statisticsData ? (
        <>
          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>収益分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ¥{statisticsData.revenueAnalytics.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">総収益</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ¥{statisticsData.revenueAnalytics.averageOrderValue.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">平均注文価格</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    statisticsData.revenueAnalytics.revenueGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {statisticsData.revenueAnalytics.revenueGrowthRate > 0 ? '+' : ''}
                    {statisticsData.revenueAnalytics.revenueGrowthRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">成長率</p>
                </div>
              </div>
              
              <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
                <p className="text-gray-700">収益推移グラフ（実装中）</p>
              </div>
            </CardContent>
          </Card>

          {/* Fan Demographics */}
          <Card>
            <CardHeader>
              <CardTitle>ファン属性分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">性別分布</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>男性</span>
                      <span className="font-medium">{statisticsData.fanDemographics.genderDistribution.male}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>女性</span>
                      <span className="font-medium">{statisticsData.fanDemographics.genderDistribution.female}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>その他</span>
                      <span className="font-medium">{statisticsData.fanDemographics.genderDistribution.other}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">年齢分布</h4>
                  <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
                    <p className="text-gray-700">年齢分布チャート（実装中）</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gacha Rankings */}
          {statisticsData.gachaRankings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ガチャパフォーマンスランキング</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statisticsData.gachaRankings.slice(0, 5).map((gacha) => (
                    <div key={gacha.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-semibold text-sm">
                          {gacha.ranking}
                        </div>
                        <div>
                          <h4 className="font-medium">{gacha.title}</h4>
                          <p className="text-sm text-gray-600">{gacha.drawCount}回実行</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          ¥{gacha.revenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-gray-600">
                          転換率: {gacha.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversion Rates */}
          <Card>
            <CardHeader>
              <CardTitle>コンバージョン分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600">
                  {statisticsData.conversionRates.overallConversionRate.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">全体コンバージョン率</p>
              </div>
              
              <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                <p className="text-gray-700">ファネル分析チャート（実装中）</p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">統計データがありません</p>
          <p className="text-sm text-gray-700 mt-2">データが蓄積されると分析情報が表示されます</p>
        </div>
      )}
    </div>
  )
}