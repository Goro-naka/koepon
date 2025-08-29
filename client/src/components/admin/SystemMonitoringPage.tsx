'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAdminStore } from '@/stores/admin'

export const SystemMonitoringPage: React.FC = () => {
  const [realTimeData, setRealTimeData] = useState(true)
  const [alertLevel, setAlertLevel] = useState<string>('all')

  const {
    systemMetrics,
    apiMetrics,
    errorLogs,
    alerts,
    isConnected,
    isLoading,
    errors,
    fetchSystemMetrics,
    subscribeToUpdates,
    unsubscribeFromUpdates,
  } = useAdminStore()

  useEffect(() => {
    fetchSystemMetrics()
    if (realTimeData) {
      subscribeToUpdates()
    }
    
    return () => {
      unsubscribeFromUpdates()
    }
  }, [fetchSystemMetrics, subscribeToUpdates, unsubscribeFromUpdates, realTimeData])

  const handleToggleRealTime = () => {
    setRealTimeData(!realTimeData)
  }

  const handleRetry = () => {
    fetchSystemMetrics()
  }

  const filteredAlerts = alertLevel === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.level === alertLevel)

  if (isLoading && systemMetrics.length === 0) {
    return (
      <div className="space-y-6">
        <div data-testid="monitoring-loading-skeleton" className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (errors.metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{errors.metrics}</p>
        <Button onClick={handleRetry}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">システム監視</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isConnected ? 'リアルタイム接続中' : 'オフライン'}</span>
          </div>
          <Button
            variant={realTimeData ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggleRealTime}
            data-testid="realtime-toggle"
          >
            {realTimeData ? 'リアルタイム停止' : 'リアルタイム開始'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">システム概要</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`text-xs mt-1 ${
                  metric.status === 'healthy' ? 'text-green-600' :
                  metric.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metric.status === 'healthy' ? '正常' :
                   metric.status === 'warning' ? '警告' : '異常'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* API Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>API監視</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiMetrics.map((api, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{api.endpoint}</p>
                  <p className="text-sm text-gray-600">{api.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{api.responseTime}ms</p>
                  <p className={`text-sm ${api.errorRate > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                    エラー率: {api.errorRate}%
                  </p>
                </div>
              </div>
            ))}
            {apiMetrics.length === 0 && (
              <p className="text-center text-gray-600 py-4">APIメトリクスがありません</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>システムアラート</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={alertLevel === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlertLevel('all')}
              >
                すべて
              </Button>
              <Button
                variant={alertLevel === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlertLevel('critical')}
              >
                重要
              </Button>
              <Button
                variant={alertLevel === 'warning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAlertLevel('warning')}
              >
                警告
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
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
            {filteredAlerts.length === 0 && (
              <p className="text-center text-gray-600 py-4">アラートがありません</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <CardTitle>エラーログ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {errorLogs.map((log, index) => (
              <div key={index} className="p-2 bg-red-50 border-l-4 border-red-400 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-red-800">{log.message}</p>
                    <p className="text-red-600 text-xs mt-1">{log.source}</p>
                  </div>
                  <span className="text-xs text-red-600">
                    {new Date(log.timestamp).toLocaleString('ja-JP')}
                  </span>
                </div>
              </div>
            ))}
            {errorLogs.length === 0 && (
              <p className="text-center text-gray-600 py-4">エラーログがありません</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}