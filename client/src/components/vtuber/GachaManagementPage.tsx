import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVTuberStore } from '@/stores/vtuber'
import type { GachaManagementData } from '@/types/vtuber'

const SKELETON_CARDS = Array.from({ length: 6 }, (_, i) => i + 1)

export const GachaManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'draft' | 'inactive'>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedGacha, setSelectedGacha] = useState<GachaManagementData | null>(null)

  const {
    gachaList,
    isLoading,
    error,
    fetchGachaList,
    createGacha,
    updateGacha,
    deleteGacha,
  } = useVTuberStore()

  useEffect(() => {
    fetchGachaList()
  }, [fetchGachaList])

  const filteredGachaList = React.useMemo(() => {
    let filtered = gachaList

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(gacha =>
        gacha.title.toLowerCase().includes(query) ||
        gacha.description.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(gacha => gacha.status === statusFilter)
    }

    return filtered
  }, [gachaList, searchQuery, statusFilter])

  const handleCreateGacha = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleEditGacha = useCallback((gacha: GachaManagementData) => {
    setSelectedGacha(gacha)
    setShowEditModal(true)
  }, [])

  const handlePreviewGacha = useCallback((gacha: GachaManagementData) => {
    setSelectedGacha(gacha)
    setShowPreviewModal(true)
  }, [])

  const handleDeleteClick = useCallback((gacha: GachaManagementData) => {
    setSelectedGacha(gacha)
    setShowDeleteDialog(true)
  }, [])

  const handleStatusToggle = useCallback(async (gachaId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await updateGacha(gachaId, { status: newStatus })
      
      // Show success message (in a real app, this would be a toast notification)
      alert('ステータスを更新しました')
    } catch (_error) {
      console.error("Error:", _error)
    }
  }, [updateGacha])

  const confirmDelete = useCallback(async () => {
    if (!selectedGacha) return

    try {
      await deleteGacha(selectedGacha.id)
      setShowDeleteDialog(false)
      setSelectedGacha(null)
      
      // Show success message
      alert('ガチャを削除しました')
    } catch (_error) {
      console.error("Error:", _error)
    }
  }, [selectedGacha, deleteGacha])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div data-testid="gacha-loading-skeleton" className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SKELETON_CARDS.map((i) => (
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
        <Button onClick={fetchGachaList}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ガチャ管理</h1>
        <Button onClick={handleCreateGacha}>
          新しいガチャを作成
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="ガチャを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            すべて
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
          >
            公開中のみ
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('draft')}
          >
            下書きのみ
          </Button>
        </div>
      </div>

      {/* Gacha Grid */}
      {filteredGachaList.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">まだガチャが作成されていません</h2>
          <p className="text-gray-800 mb-6">最初のガチャを作成しましょう</p>
          <Button onClick={handleCreateGacha}>
            新しいガチャを作成
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGachaList.map((gacha) => (
            <Card key={gacha.id} className="hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={gacha.thumbnailImage}
                  alt={gacha.title}
                  className="w-full h-full object-cover rounded-t-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-gacha.jpg'
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    gacha.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : gacha.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {gacha.status === 'active' ? '公開中' : 
                     gacha.status === 'draft' ? '下書き' : '非公開'}
                  </span>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg">{gacha.title}</CardTitle>
                <p className="text-sm text-gray-600">{gacha.description}</p>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{gacha.price}円</span>
                    <span className="text-sm text-gray-700">
                      {gacha.totalDraws}回実行
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    売上: ¥{gacha.revenue.toLocaleString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewGacha(gacha)}
                    >
                      プレビュー
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditGacha(gacha)}
                    >
                      編集
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`status-toggle-${gacha.id}`}
                      onClick={() => handleStatusToggle(gacha.id, gacha.status)}
                    >
                      {gacha.status === 'active' ? '非公開' : '公開'}
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    data-testid="delete-gacha-button"
                    onClick={() => handleDeleteClick(gacha)}
                  >
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div 
          data-testid="create-gacha-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">ガチャ作成</h2>
            <p>ガチャ作成フォームは実装中です...</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setShowCreateModal(false)}>
                作成
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedGacha && (
        <div 
          data-testid="edit-gacha-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">ガチャ編集</h2>
            <p>ガチャ編集フォームは実装中です...</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setShowEditModal(false)}>
                更新
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedGacha && (
        <div 
          data-testid="gacha-preview-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">ガチャプレビュー</h2>
            <div className="space-y-4">
              <img
                src={selectedGacha.thumbnailImage}
                alt={selectedGacha.title}
                className="w-full h-48 object-cover rounded"
              />
              <h3 className="text-lg font-semibold">{selectedGacha.title}</h3>
              <p>{selectedGacha.description}</p>
              <div className="text-lg font-bold">{selectedGacha.price}円</div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedGacha && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">ガチャを削除</h2>
            <p className="mb-2">本当に削除しますか？</p>
            <p className="text-sm text-gray-800 mb-6">この操作は取り消せません</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                キャンセル
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                削除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}