'use client'

export default function VTuberReviewPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">VTuber審査管理</h1>
        <p className="text-gray-600 mt-2">新規申請の審査・承認を行います</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">審査待ち</h3>
          <p className="text-2xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">審査中</h3>
          <p className="text-2xl font-bold text-yellow-600">0</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">承認済み</h3>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">却下</h3>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
      </div>

      {/* 申請一覧テーブル */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">申請一覧</h2>
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
                  メールアドレス
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
              {/* データベースからデータを取得するため、現在は空の状態 */}
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  VTuber申請データがありません
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* アクション */}
      <div className="flex justify-between mt-6">
        <div className="flex space-x-3">
          <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option>一括アクション選択</option>
            <option>一括承認</option>
            <option>一括却下</option>
            <option>担当者割り当て</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
            実行
          </button>
        </div>
        <div className="flex space-x-3">
          <button className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
            エクスポート
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
            新規申請追加
          </button>
        </div>
      </div>
    </div>
  )
}