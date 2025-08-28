import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useVTuberStore } from '@/stores/vtuber'

const DATE_RANGES = [
  { key: '7d', label: '過去7日間' },
  { key: '30d', label: '過去30日間' },
  { key: '90d', label: '過去90日間' },
  { key: '1y', label: '過去1年間' },
] as const

export const VTuberDashboardPage: React.FC = () => {
  const [selectedDateRange, setSelectedDateRange] = useState<string>('30d')

  const {
    dashboardMetrics,
    isLoading,
    error,
    fetchDashboardMetrics,
  } = useVTuberStore()

  useEffect(() => {
    fetchDashboardMetrics()
  }, [fetchDashboardMetrics])

  const formattedMetrics = useMemo(() => {
    if (!dashboardMetrics) return null

    return {
      totalRevenue: `¥${dashboardMetrics.totalRevenue.toLocaleString()}`,
      monthlyRevenue: `¥${dashboardMetrics.monthlyRevenue.toLocaleString()}`,
      weeklyRevenue: `¥${dashboardMetrics.weeklyRevenue.toLocaleString()}`,
      dailyRevenue: `¥${dashboardMetrics.dailyRevenue.toLocaleString()}`,
      fanCount: dashboardMetrics.fanCount.toLocaleString(),
      fanGrowthRate: dashboardMetrics.fanGrowthRate > 0 
        ? `+${dashboardMetrics.fanGrowthRate.toFixed(1)}%`
        : `${dashboardMetrics.fanGrowthRate.toFixed(1)}%`,
      totalGachaDraws: dashboardMetrics.totalGachaDraws.toLocaleString(),
      averageRevenuePerUser: `¥${Math.round(dashboardMetrics.averageRevenuePerUser).toLocaleString()}`,
    }
  }, [dashboardMetrics])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {[1, 2].map((i) => (
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
        <Button onClick={fetchDashboardMetrics}>再試行</Button>
      </div>
    )
  }

  if (!dashboardMetrics || !formattedMetrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">ダッシュボードデータがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="flex gap-2">
          {DATE_RANGES.map(({ key, label }) => (
            <Button
              key={key}
              variant={selectedDateRange === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDateRange(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総収益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedMetrics.totalRevenue}</div>
            <p className="text-xs text-green-600 mt-1">
              月間: {formattedMetrics.monthlyRevenue}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ファン数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedMetrics.fanCount}</div>
            <p className={`text-xs mt-1 ${
              dashboardMetrics.fanGrowthRate > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              成長率: {formattedMetrics.fanGrowthRate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ガチャ実行数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedMetrics.totalGachaDraws}</div>
            <p className="text-xs text-gray-600 mt-1">総実行回数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均単価</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedMetrics.averageRevenuePerUser}</div>
            <p className="text-xs text-gray-600 mt-1">ユーザー1人あたり</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>収益推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-700">収益チャート（実装中）</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ファン数推移</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-700">ファン数チャート（実装中）</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Gacha */}
      {dashboardMetrics.topPerformingGacha && (
        <Card>
          <CardHeader>
            <CardTitle>最高収益ガチャ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{dashboardMetrics.topPerformingGacha.title}</h3>
                <p className="text-sm text-gray-600">ID: {dashboardMetrics.topPerformingGacha.id}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  ¥{dashboardMetrics.topPerformingGacha.revenue.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">売上</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities */}
      {dashboardMetrics.recentActivities && dashboardMetrics.recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardMetrics.recentActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <h4 className="font-medium">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-700">
                    {new Date(activity.timestamp).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}