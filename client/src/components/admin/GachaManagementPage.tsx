'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminStore } from '@/stores/admin'

interface GachaData {
  id?: string
  title: string
  vtuberName: string
  description: string
  status: string
  startDate: string
  endDate: string
  totalDraws?: number
  revenue?: number
  items?: number
}

interface GachaFormData {
  title: string
  vtuberName: string
  description: string
  status: string
  startDate: string
  endDate: string
}

export const GachaManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingGacha, setEditingGacha] = useState<GachaData | null>(null)
  const [gachaList, setGachaList] = useState<GachaData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<GachaFormData>({
    title: '',
    vtuberName: '',
    description: '',
    status: 'draft',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch gacha list
  const fetchGachaList = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/gacha')
      if (!response.ok) {
        throw new Error('Failed to fetch gacha list')
      }
      const data = await response.json()
      setGachaList(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gacha list')
      setGachaList([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGachaList()
  }, [])

  const resetForm = () => {
    setFormData({
      title: '',
      vtuberName: '',
      description: '',
      status: 'draft',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    setEditingGacha(null)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      fetchGachaList()
      return
    }
    
    const filtered = gachaList.filter(gacha => 
      gacha.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gacha.vtuberName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setGachaList(filtered)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    
    if (!status) {
      fetchGachaList()
      return
    }
    
    const filtered = gachaList.filter(gacha => gacha.status === status)
    setGachaList(filtered)
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const handleEdit = (gacha: GachaData) => {
    setEditingGacha(gacha)
    setFormData({
      title: gacha.title,
      vtuberName: gacha.vtuberName,
      description: gacha.description,
      status: gacha.status,
      startDate: gacha.startDate.split('T')[0],
      endDate: gacha.endDate.split('T')[0]
    })
    setShowEditDialog(true)
  }

  const handleDelete = (gacha: GachaData) => {
    setEditingGacha(gacha)
    setShowDeleteDialog(true)
  }

  const submitCreate = async () => {
    if (!formData.title.trim() || !formData.vtuberName.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/gacha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create gacha')
      }
      
      const result = await response.json()
      if (result.success) {
        setShowCreateDialog(false)
        resetForm()
        await fetchGachaList()
      } else {
        setError(result.message || 'Failed to create gacha')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gacha')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitEdit = async () => {
    if (!editingGacha || !formData.title.trim() || !formData.vtuberName.trim()) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/gacha/${editingGacha.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update gacha')
      }
      
      const result = await response.json()
      if (result.success) {
        setShowEditDialog(false)
        resetForm()
        await fetchGachaList()
      } else {
        setError(result.message || 'Failed to update gacha')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gacha')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!editingGacha) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/gacha/${editingGacha.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete gacha')
      }
      
      const result = await response.json()
      if (result.success) {
        setShowDeleteDialog(false)
        resetForm()
        await fetchGachaList()
      } else {
        setError(result.message || 'Failed to delete gacha')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gacha')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (isLoading && gachaList.length === 0) {
    return (
      <div className="space-y-6">
        <div data-testid="gacha-management-loading-skeleton" className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ガチャ管理</h1>
        <Button onClick={handleCreate}>新規ガチャ作成</Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="ガチャ名・VTuber名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch}>検索</Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('')}
          >
            すべて
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('active')}
          >
            開催中
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('draft')}
          >
            下書き
          </Button>
        </div>
      </div>

      {/* Gacha List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gachaList.map((gacha) => (
          <Card key={gacha.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{gacha.title}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  gacha.status === 'active' ? 'bg-green-100 text-green-800' :
                  gacha.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {gacha.status === 'active' ? '開催中' :
                   gacha.status === 'draft' ? '下書き' :
                   gacha.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  <strong>VTuber:</strong> {gacha.vtuberName}
                </p>
                <p className="text-sm text-gray-700 line-clamp-2">{gacha.description}</p>
                
                <div className="text-sm text-gray-600">
                  <p>開始: {new Date(gacha.startDate).toLocaleDateString('ja-JP')}</p>
                  <p>終了: {new Date(gacha.endDate).toLocaleDateString('ja-JP')}</p>
                </div>
                
                {gacha.totalDraws !== undefined && (
                  <div className="text-sm text-gray-600">
                    <p>総抽選数: {formatNumber(gacha.totalDraws)}</p>
                    {gacha.revenue !== undefined && (
                      <p>売上: {formatCurrency(gacha.revenue)}</p>
                    )}
                    {gacha.items !== undefined && (
                      <p>アイテム数: {gacha.items}</p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(gacha)}
                    className="flex-1"
                  >
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(gacha)}
                    className="flex-1"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {gachaList.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-600">ガチャがありません</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">新規ガチャ作成</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">ガチャ名 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ガチャ名を入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="vtuberName">VTuber名 *</Label>
                <Input
                  id="vtuberName"
                  value={formData.vtuberName}
                  onChange={(e) => setFormData(prev => ({ ...prev, vtuberName: e.target.value }))}
                  placeholder="VTuber名を入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="ガチャの説明を入力..."
                  className="h-20"
                />
              </div>
              
              <div>
                <Label htmlFor="status">ステータス</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="draft">下書き</option>
                  <option value="active">開催中</option>
                  <option value="ended">終了</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">開始日</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">終了日</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                onClick={submitCreate}
                disabled={isSubmitting || !formData.title.trim() || !formData.vtuberName.trim()}
              >
                {isSubmitting ? '作成中...' : '作成'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && editingGacha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">ガチャ編集</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">ガチャ名 *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ガチャ名を入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-vtuberName">VTuber名 *</Label>
                <Input
                  id="edit-vtuberName"
                  value={formData.vtuberName}
                  onChange={(e) => setFormData(prev => ({ ...prev, vtuberName: e.target.value }))}
                  placeholder="VTuber名を入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="ガチャの説明を入力..."
                  className="h-20"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-status">ステータス</Label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="draft">下書き</option>
                  <option value="active">開催中</option>
                  <option value="ended">終了</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">開始日</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">終了日</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                onClick={submitEdit}
                disabled={isSubmitting || !formData.title.trim() || !formData.vtuberName.trim()}
              >
                {isSubmitting ? '更新中...' : '更新'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && editingGacha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">ガチャを削除しますか？</h3>
            <p className="text-sm text-gray-600 mb-6">
              「{editingGacha.title}」を削除します。この操作は取り消せません。
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? '削除中...' : '削除する'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}