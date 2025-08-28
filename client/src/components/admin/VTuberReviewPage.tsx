import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminStore } from '@/stores/admin'
import type { AdminAction, VTuberApplicationReview } from '@/types/admin'

const STATUS_LABELS = {
  pending: '審査待ち',
  under_review: '審査中',
  approved: '承認済み',
  rejected: '却下',
  requires_info: '追加情報必要'
}

const PRIORITY_LABELS = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '緊急'
}

export const VTuberReviewPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const {
    applications,
    selectedApplication,
    selectedApplicationIds,
    isLoading,
    errors,
    fetchApplications,
    reviewApplication,
    selectApplication,
    selectApplicationIds,
  } = useAdminStore()

  useEffect(() => {
    fetchApplications({
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }, [fetchApplications])

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    fetchApplications({
      status: status ? [status] : undefined,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleSearch = () => {
    fetchApplications({
      search: searchQuery,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  const handleApplicationClick = (application: VTuberApplicationReview) => {
    selectApplication(application)
  }

  const handleApprove = async () => {
    if (!selectedApplication) return
    
    const action: AdminAction = {
      type: 'vtuber_approve',
      targetId: selectedApplication.id,
      targetType: 'vtuber'
    }
    
    await reviewApplication(selectedApplication.id, action)
    setShowApproveDialog(false)
  }

  const handleReject = async () => {
    if (!selectedApplication || !rejectReason.trim()) return
    
    const action: AdminAction = {
      type: 'vtuber_reject',
      targetId: selectedApplication.id,
      targetType: 'vtuber',
      reason: rejectReason
    }
    
    await reviewApplication(selectedApplication.id, action)
    setShowRejectDialog(false)
    setRejectReason('')
  }

  const handleSelectApplication = (applicationId: string, checked: boolean) => {
    const currentIds = selectedApplicationIds || []
    const newIds = checked 
      ? [...currentIds, applicationId]
      : currentIds.filter(id => id !== applicationId)
    selectApplicationIds(newIds)
  }

  const handleBulkAction = (actionType: 'approve' | 'reject') => {
    console.log(`Bulk ${actionType} for applications:`, selectedApplicationIds)
    // TODO: Implement bulk operations
  }

  const handleRetry = () => {
    fetchApplications({
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    })
  }

  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-6">
        <div data-testid="review-loading-skeleton" className="animate-pulse">
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
        <h1 className="text-2xl font-bold">VTuber審査管理</h1>
        {selectedApplicationIds && selectedApplicationIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedApplicationIds.length}件選択中</span>
            <Button size="sm" onClick={() => handleBulkAction('approve')}>一括承認</Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>一括却下</Button>
          </div>
        )}
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
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('pending')}
          >
            審査待ちのみ
          </Button>
          <Button
            variant={statusFilter === 'under_review' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusFilter('under_review')}
          >
            審査中のみ
          </Button>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={(selectedApplicationIds || []).includes(application.id)}
                    onChange={(e) => handleSelectApplication(application.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() => handleApplicationClick(application)}
                  >
                    <h3 className="font-semibold text-lg">{application.applicant.channelName}</h3>
                    <p className="text-sm text-gray-600">{application.applicant.email}</p>
                    <p className="text-xs text-gray-700">
                      申請日: {new Date(application.applicant.applicationDate).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    application.status === 'pending' ? 'bg-yellow-100 text-yellow-800 badge-pending' :
                    application.status === 'under_review' ? 'bg-blue-100 text-blue-800 badge-under-review' :
                    application.status === 'approved' ? 'bg-green-100 text-green-800 badge-approved' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800 badge-rejected' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {STATUS_LABELS[application.status]}
                  </span>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    application.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    application.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    application.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {PRIORITY_LABELS[application.priority]}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {applications.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">申請がありません</p>
          </div>
        )}

        {/* Pagination */}
        {applications.length > 0 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              {applications.length}件の申請
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>前へ</Button>
              <Button variant="outline" size="sm" disabled>次へ</Button>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div 
          data-testid="application-detail-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => selectApplication(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">申請詳細</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">チャンネル情報</h3>
                <div className="space-y-2">
                  <p><strong>チャンネル名:</strong> {selectedApplication.applicant.channelName}</p>
                  <p><strong>メールアドレス:</strong> {selectedApplication.applicant.email}</p>
                  <p><strong>申請日:</strong> {new Date(selectedApplication.applicant.applicationDate).toLocaleString('ja-JP')}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">審査履歴</h3>
                <div className="space-y-2">
                  {selectedApplication.reviewHistory.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium">{review.reviewerName}</p>
                      <p className="text-sm text-gray-600">{review.action === 'review_started' ? '審査を開始しました' : review.action}</p>
                      <p className="text-xs text-gray-700">{new Date(review.timestamp).toLocaleString('ja-JP')}</p>
                      {review.comment && <p className="text-sm mt-1">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => selectApplication(null)}
                >
                  閉じる
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                >
                  却下
                </Button>
                <Button
                  onClick={() => console.log('追加情報要求')}
                >
                  追加情報要求
                </Button>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                >
                  承認
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">申請を承認しますか？</h3>
            <p className="text-sm text-gray-600 mb-6">
              この操作により、{selectedApplication?.applicant.channelName} の申請が承認されます。
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
              >
                キャンセル
              </Button>
              <Button onClick={handleApprove}>承認する</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">却下理由を入力してください</h3>
            <textarea
              placeholder="却下理由を入力..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-24 p-3 border rounded-md resize-none"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                キャンセル
              </Button>
              <Button 
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                却下する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}