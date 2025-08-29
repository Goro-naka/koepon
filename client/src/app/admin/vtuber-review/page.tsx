'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'

export default function VTuberReviewPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">VTuber審査</h1>
        </div>

        {/* 審査状況サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">待機中</h3>
            <p className="text-3xl font-bold text-yellow-600">3</p>
            <p className="text-sm text-gray-500">新規申請</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">審査中</h3>
            <p className="text-3xl font-bold text-blue-600">5</p>
            <p className="text-sm text-gray-500">担当者割り当て済み</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">承認済み</h3>
            <p className="text-3xl font-bold text-green-600">89</p>
            <p className="text-sm text-gray-500">今月: +12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">却下</h3>
            <p className="text-3xl font-bold text-red-600">7</p>
            <p className="text-sm text-gray-500">今月: +1</p>
          </div>
        </div>

        {/* 申請一覧 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">審査待ち申請</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    チャンネル名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    申請日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    APP-001
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    星月ひな Ch.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    hina@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2025-08-23
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      審査中
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      高
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    管理者A
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      詳細
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      承認
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      却下
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    APP-002
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    桜井みお Ch.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    mio@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2025-08-18
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      待機中
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      中
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    未割り当て
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      詳細
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      担当
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      承認
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      却下
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    APP-003
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    音羽ゆめ Ch.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    yume@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    2025-08-27
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                      追加情報必要
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      低
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    管理者B
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      詳細
                    </button>
                    <button className="text-purple-600 hover:text-purple-900">
                      催促
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      却下
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* アクション */}
        <div className="flex justify-between">
          <div className="flex space-x-3">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>すべてのステータス</option>
              <option>待機中</option>
              <option>審査中</option>
              <option>追加情報必要</option>
            </select>
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>すべての優先度</option>
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              一括処理
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
              レポート出力
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}