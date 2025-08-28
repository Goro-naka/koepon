import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminStore } from '@/stores/admin'
import type { AdminAction } from '@/types/admin'

const USER_STATUS_LABELS = {
  active: 'アクティブ',
  suspended: '停止中',
  pending: '保留中',
  banned: '禁止'
}

export const UserManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const {
    users,
    selectedUser,
    isLoading,
    errors,
    fetchUsers,
    performUserAction,
    selectUser,
  } = useAdminStore()

  useEffect(() => {
    fetchUsers({
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }, [fetchUsers])

  const handleSearch = () => {
    fetchUsers({
      search: searchQuery,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    fetchUsers({
      status: status ? [status] : undefined,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleUserClick = async (userId: string) => {
    await selectUser(userId)
  }

  const handleSuspendUser = (userId: string) => {
    setSelectedUserId(userId)
    setShowSuspendDialog(true)
  }

  const handleRestoreUser = (userId: string) => {
    setSelectedUserId(userId)
    setShowRestoreDialog(true)
  }

  const confirmSuspend = async () => {
    if (!selectedUserId || !suspendReason.trim()) return
    
    const action: AdminAction = {
      type: 'user_suspend',
      targetId: selectedUserId,
      targetType: 'user',
      reason: suspendReason
    }
    
    await performUserAction(selectedUserId, action)
    setShowSuspendDialog(false)
    setSuspendReason('')
    setSelectedUserId('')
  }

  const confirmRestore = async () => {
    if (!selectedUserId) return
    
    const action: AdminAction = {
      type: 'user_restore',
      targetId: selectedUserId,
      targetType: 'user'
    }
    
    await performUserAction(selectedUserId, action)
    setShowRestoreDialog(false)
    setSelectedUserId('')
  }

  const handleRetry = () => {
    fetchUsers({
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div data-testid="users-loading-skeleton" className="animate-pulse">
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

  if (errors.users) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{errors.users}</p>
        <Button onClick={handleRetry}>再試行</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="ユーザー名で検索..."
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
            アクティブのみ
          </Button>
          <Button
            variant={statusFilter === 'suspended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('suspended')}
          >
            停止中のみ
          </Button>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => handleUserClick(user.id)}
                >
                  <h3 className="font-semibold text-lg">{user.username}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-700">
                    登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">メダル: {user.medalCount}</p>
                    <p className="text-xs text-gray-600">
                      最終ログイン: {new Date(user.lastLoginAt).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800 badge-active' :
                    user.status === 'suspended' ? 'bg-red-100 text-red-800 badge-suspended' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800 badge-pending' :
                    'bg-gray-100 text-gray-800 badge-banned'
                  }`}>
                    {USER_STATUS_LABELS[user.status]}
                  </span>
                  
                  <div className="flex gap-2">
                    {user.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspendUser(user.id)}
                      >
                        停止
                      </Button>
                    ) : user.status === 'suspended' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreUser(user.id)}
                      >
                        復帰
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">ユーザーがありません</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div 
          data-testid="user-detail-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => selectUser('')}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">ユーザー詳細</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">基本情報</h3>
                <div className="space-y-2">
                  <p><strong>ユーザー名:</strong> {selectedUser.username}</p>
                  <p><strong>メールアドレス:</strong> {selectedUser.email}</p>
                  <p><strong>登録日:</strong> {new Date(selectedUser.createdAt).toLocaleString('ja-JP')}</p>
                  <p><strong>最終ログイン:</strong> {new Date(selectedUser.lastLoginAt).toLocaleString('ja-JP')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">統計情報</h3>
                <div className="space-y-2">
                  <p><strong>メダル総数:</strong> {selectedUser.medalCount}</p>
                  <p><strong>投げ銭総額:</strong> ¥{selectedUser.totalDonations?.toLocaleString() || 0}</p>
                  <p><strong>VTuber登録数:</strong> {selectedUser.vtuberCount || 0}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => selectUser('')}
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Dialog */}
      {showSuspendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">ユーザーを停止しますか？</h3>
            <textarea
              placeholder="停止理由を入力..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full h-24 p-3 border rounded-md resize-none"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowSuspendDialog(false)}
              >
                キャンセル
              </Button>
              <Button 
                onClick={confirmSuspend}
                disabled={!suspendReason.trim()}
              >
                停止する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">ユーザーを復帰させますか？</h3>
            <p className="text-sm text-gray-600 mb-6">
              この操作により、ユーザーは再びシステムを利用できるようになります。
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRestoreDialog(false)}
              >
                キャンセル
              </Button>
              <Button onClick={confirmRestore}>復帰させる</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}