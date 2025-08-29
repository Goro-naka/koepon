'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'

export default function SystemMonitoringPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">システム監視</h1>
        </div>

        {/* システム状態カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">API サーバー</h3>
                <p className="text-sm text-green-600">正常稼働中</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">データベース</h3>
                <p className="text-sm text-green-600">接続正常</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Redis</h3>
                <p className="text-sm text-green-600">キャッシュ正常</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">ストレージ</h3>
                <p className="text-sm text-yellow-600">容量使用率 85%</p>
              </div>
            </div>
          </div>
        </div>

        {/* パフォーマンスメトリクス */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">レスポンス時間</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API 平均レスポンス</span>
                <span className="text-sm font-medium text-green-600">145ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">DB クエリ平均</span>
                <span className="text-sm font-medium text-green-600">32ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">キャッシュヒット率</span>
                <span className="text-sm font-medium text-blue-600">94.2%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">エラー率</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">4xx エラー</span>
                <span className="text-sm font-medium text-yellow-600">0.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">5xx エラー</span>
                <span className="text-sm font-medium text-red-600">0.02%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">全体エラー率</span>
                <span className="text-sm font-medium text-green-600">0.12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* アラート一覧 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">システムアラート</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-6 flex items-start">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mt-1"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">警告:</span> server-02のCPU使用率が高くなっています (85%)
                </p>
                <p className="text-xs text-gray-500 mt-1">2025-08-28 15:45:12</p>
              </div>
            </div>
            
            <div className="p-6 flex items-start">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-400 rounded-full mt-1"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">正常:</span> 全サービスのヘルスチェックが正常です
                </p>
                <p className="text-xs text-gray-500 mt-1">2025-08-28 15:30:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            ログをエクスポート
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            詳細監視画面
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}