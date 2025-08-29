'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminStore } from '@/stores/admin'
import type { VTuberApplicationReview } from '@/types/admin'

interface VTuberFormData {
  channelName: string
  email: string
  description?: string
  status: string
  priority: string
}

export const VTuberManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingVTuber, setEditingVTuber] = useState<VTuberApplicationReview | null>(null)
  const [formData, setFormData] = useState<VTuberFormData>({
    channelName: '',
    email: '',
    description: '',
    status: 'pending',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    applications,
    isLoading,
    errors,
    fetchApplications,
    createVTuber,
    updateVTuber,
    deleteVTuber,
  } = useAdminStore()

  useEffect(() => {
    fetchApplications({
      dateRange: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }, [fetchApplications])

  const resetForm = () => {
    setFormData({
      channelName: '',
      email: '',
      description: '',
      status: 'pending',
      priority: 'medium'
    })
    setEditingVTuber(null)
  }

  const handleSearch = () => {
    fetchApplications({
      search: searchQuery,
      dateRange: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    fetchApplications({
      status: status ? [status] : undefined,
      dateRange: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleCreate = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  const handleEdit = (vtuber: VTuberApplicationReview) => {
    setEditingVTuber(vtuber)
    setFormData({
      channelName: vtuber.applicant.channelName,
      email: vtuber.applicant.email,
      description: '',
      status: vtuber.status,
      priority: vtuber.priority
    })
    setShowEditDialog(true)
  }

  const handleDelete = (vtuber: VTuberApplicationReview) => {
    setEditingVTuber(vtuber)
    setShowDeleteDialog(true)
  }

  const submitCreate = async () => {
    if (!formData.channelName.trim() || !formData.email.trim()) return
    
    setIsSubmitting(true)
    try {
      const success = await createVTuber({
        channelName: formData.channelName,
        email: formData.email,
        description: formData.description,
        status: formData.status as any,
        priority: formData.priority as any
      })
      
      if (success) {
        setShowCreateDialog(false)
        resetForm()
        // Refresh the list
        fetchApplications({
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          }
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitEdit = async () => {
    if (!editingVTuber || !formData.channelName.trim() || !formData.email.trim()) return
    
    setIsSubmitting(true)
    try {
      const success = await updateVTuber(editingVTuber.id, {
        channelName: formData.channelName,
        email: formData.email,
        description: formData.description,
        status: formData.status as any,
        priority: formData.priority as any
      })
      
      if (success) {
        setShowEditDialog(false)
        resetForm()
        // Refresh the list
        fetchApplications({
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          }
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!editingVTuber) return
    
    setIsSubmitting(true)
    try {
      const success = await deleteVTuber(editingVTuber.id)
      
      if (success) {
        setShowDeleteDialog(false)
        resetForm()
        // Refresh the list
        fetchApplications({
          dateRange: {
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          }
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    fetchApplications({
      dateRange: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-6">
        <div data-testid="vtuber-management-loading-skeleton" className="animate-pulse">
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

  if (errors.applications) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{errors.applications}</p>
        <Button onClick={handleRetry}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">VTuber管理</h1>
        <Button onClick={handleCreate}>新規VTuber作成</Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="チャンネル名で検索..."
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
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('approved')}
          >
            承認済み
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('pending')}
          >
            審査待ち
          </Button>
        </div>
      </div>

      {/* VTuber List */}
      <div className="space-y-4">
        {applications.map((vtuber) => (
          <Card key={vtuber.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{vtuber.applicant.channelName}</h3>
                  <p className="text-sm text-gray-600">{vtuber.applicant.email}</p>
                  <p className="text-xs text-gray-700">
                    申請日: {new Date(vtuber.applicant.applicationDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vtuber.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    vtuber.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                    vtuber.status === 'approved' ? 'bg-green-100 text-green-800' :
                    vtuber.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vtuber.status === 'pending' ? '審査待ち' :
                     vtuber.status === 'under_review' ? '審査中' :
                     vtuber.status === 'approved' ? '承認済み' :
                     vtuber.status === 'rejected' ? '却下' :
                     vtuber.status}
                  </span>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(vtuber)}
                    >
                      編集
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(vtuber)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {applications.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">VTuberがありません</p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">新規VTuber作成</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="channelName">チャンネル名 *</Label>
                <Input
                  id="channelName"
                  value={formData.channelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, channelName: e.target.value }))}
                  placeholder="チャンネル名を入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="email">メールアドレス *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="メールアドレスを入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="説明を入力..."
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
                  <option value="pending">審査待ち</option>
                  <option value="under_review">審査中</option>
                  <option value="approved">承認済み</option>
                  <option value="rejected">却下</option>
                  <option value="requires_info">追加情報必要</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="priority">優先度</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">緊急</option>
                </select>
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
                disabled={isSubmitting || !formData.channelName.trim() || !formData.email.trim()}
              >
                {isSubmitting ? '作成中...' : '作成'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && editingVTuber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">VTuber編集</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-channelName">チャンネル名 *</Label>
                <Input
                  id="edit-channelName"
                  value={formData.channelName}
                  onChange={(e) => setFormData(prev => ({ ...prev, channelName: e.target.value }))}
                  placeholder="チャンネル名を入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">メールアドレス *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="メールアドレスを入力..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="説明を入力..."
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
                  <option value="pending">審査待ち</option>
                  <option value="under_review">審査中</option>
                  <option value="approved">承認済み</option>
                  <option value="rejected">却下</option>
                  <option value="requires_info">追加情報必要</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="edit-priority">優先度</Label>
                <select
                  id="edit-priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">緊急</option>
                </select>
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
                disabled={isSubmitting || !formData.channelName.trim() || !formData.email.trim()}
              >
                {isSubmitting ? '更新中...' : '更新'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && editingVTuber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">VTuberを削除しますか？</h3>
            <p className="text-sm text-gray-600 mb-6">
              「{editingVTuber.applicant.channelName}」を削除します。この操作は取り消せません。
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