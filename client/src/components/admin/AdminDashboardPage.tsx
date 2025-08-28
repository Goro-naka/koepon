import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdminStore } from '@/stores/admin'

const PRESET_PERIODS = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '7日間' },
  { key: '30d', label: '30日間' },
  { key: '90d', label: '90日間' },
]

export const AdminDashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d')
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const {
    dashboardMetrics,
    isLoading,
    errors,
    fetchDashboardMetrics,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  } = useAdminStore()

  useEffect(() => {
    fetchDashboardMetrics(selectedPeriod)
    subscribeToUpdates()
    
    return () => {
      unsubscribeFromUpdates()
    }
  }, [fetchDashboardMetrics, subscribeToUpdates, unsubscribeFromUpdates, selectedPeriod])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    fetchDashboardMetrics(period)
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleRetry = () => {
    fetchDashboardMetrics(selectedPeriod)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number, withSign = false) => {
    const sign = withSign && value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  if (isLoading && !dashboardMetrics) {
    return (
      <div className="space-y-6">
        <div data-testid="dashboard-loading-skeleton" className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (errors.dashboard) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{errors.dashboard}</p>
        <Button onClick={handleRetry}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
        {isLoading && <div className="text-sm text-gray-600">データ更新中...</div>}
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">期間設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {PRESET_PERIODS.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={selectedPeriod === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(key)}
                >
                  {label}
                </Button>
              ))}
              <Button
                variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('custom')}
              >
                カスタム
              </Button>
            </div>
            
            {selectedPeriod === 'custom' && (
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

      {dashboardMetrics && (
        <>
          {/* System Overview */}
          <div>
            <h2 className="text-xl font-semibold mb-4">システム概要</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">総ユーザー数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(dashboardMetrics.systemOverview.totalUsers)}</div>
                  <p className="text-xs text-green-600 mt-1">
                    今日: {formatNumber(dashboardMetrics.systemOverview.newUsersToday)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">VTuber数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(dashboardMetrics.systemOverview.totalVTubers)}</div>
                  <p className="text-xs text-yellow-600 mt-1">
                    承認待ち: {formatNumber(dashboardMetrics.systemOverview.pendingApplications)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">総売上</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboardMetrics.systemOverview.totalRevenue)}</div>
                  <p className={`text-xs mt-1 ${
                    dashboardMetrics.systemOverview.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    成長率: {formatPercentage(dashboardMetrics.systemOverview.revenueGrowth, true)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">アクティブユーザー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(dashboardMetrics.systemOverview.activeUsersDAU)}</div>
                  <p className="text-xs text-gray-800 mt-1">
                    MAU: {formatNumber(dashboardMetrics.systemOverview.activeUsersMAU)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Status */}
          <div>
            <h2 className="text-xl font-semibold mb-4">システムステータス</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">API応答時間</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics.systemStatus.apiResponseTime}ms</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">エラー率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(dashboardMetrics.systemStatus.errorRate)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">キャッシュヒット率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(dashboardMetrics.systemStatus.cacheHitRate)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">ストレージ使用量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercentage(dashboardMetrics.systemStatus.storageUsage.percentage)}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${dashboardMetrics.systemStatus.storageUsage.percentage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Alerts */}
          {dashboardMetrics.systemOverview.systemAlerts && dashboardMetrics.systemOverview.systemAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>システムアラート</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardMetrics.systemOverview.systemAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`p-3 rounded-md border-l-4 ${
                        alert.level === 'critical' ? 'bg-red-50 border-red-500 alert-critical' :
                        alert.level === 'error' ? 'bg-red-50 border-red-400 alert-error' :
                        alert.level === 'warning' ? 'bg-yellow-50 border-yellow-400 alert-warning' :
                        'bg-blue-50 border-blue-400 alert-info'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(alert.timestamp).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          alert.level === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.level === 'error' ? 'bg-red-100 text-red-700' :
                          alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}