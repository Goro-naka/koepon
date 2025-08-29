'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">設定</h1>
        </div>

        {/* システム設定 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">システム設定</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                サイト名
              </label>
              <input
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                defaultValue="こえポン！"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                サイト説明
              </label>
              <textarea
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={3}
                defaultValue="推しのVTuberを応援する新しいオンラインボイスガチャ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                メンテナンスモード
              </label>
              <div className="mt-1">
                <label className="inline-flex items-center">
                  <input type="checkbox" className="form-checkbox" />
                  <span className="ml-2 text-sm text-gray-600">メンテナンスモードを有効にする</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ガチャ設定 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">ガチャ設定</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  基本ガチャ価格（円）
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  10連ガチャ価格（円）
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SSR確率（%）
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="3.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SR確率（%）
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="12.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  R確率（%）
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="35.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  N確率（%）
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="50.0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 推しメダル設定 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">推しメダル設定</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SSRメダル獲得数
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  SRメダル獲得数
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rメダル獲得数
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nメダル獲得数
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 年齢制限設定 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">年齢制限設定</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  13-15歳 日額上限（円）
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="1000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  13-15歳 月額上限（円）
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  16-17歳 日額上限（円）
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="2000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  16-17歳 月額上限（円）
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="10000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                利用時間制限
              </label>
              <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">平日利用時間</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    defaultValue="6:00-22:00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">休日利用時間</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    defaultValue="6:00-23:00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            リセット
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
            設定を保存
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}