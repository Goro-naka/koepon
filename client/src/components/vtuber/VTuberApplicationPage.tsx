import React, { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVTuberStore } from '@/stores/vtuber'
import type { VTuberApplicationFormData } from '@/types/vtuber'

const applicationSchema = z.object({
  channelName: z.string()
    .min(3, 'チャンネル名は3文字以上で入力してください')
    .max(50, 'チャンネル名は50文字以内で入力してください'),
  description: z.string()
    .min(10, 'チャンネル説明は10文字以上で入力してください')
    .max(1000, 'チャンネル説明は1000文字以内で入力してください'),
  youtubeUrl: z.string()
    .url('有効なYouTube URLを入力してください')
    .optional()
    .or(z.literal('')),
  twitterUrl: z.string()
    .url('有効なTwitter URLを入力してください')
    .optional()
    .or(z.literal('')),
  twitchUrl: z.string()
    .url('有効なTwitch URLを入力してください')
    .optional()
    .or(z.literal('')),
  agreesToTerms: z.boolean().refine(val => val, '利用規約に同意してください'),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export const VTuberApplicationPage: React.FC = () => {
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})

  const {
    vtuberInfo,
    applicationStatus,
    isLoading,
    error,
    submitApplication,
    uploadFile,
  } = useVTuberStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      channelName: '',
      description: '',
      youtubeUrl: '',
      twitterUrl: '',
      twitchUrl: '',
      agreesToTerms: false,
    }
  })

  const validateFile = useCallback((file: File, type: 'profile' | 'banner') => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      return '画像ファイル（JPG、PNG）のみアップロード可能です'
    }

    if (file.size > maxSize) {
      return 'ファイルサイズは5MB以下にしてください'
    }

    return null
  }, [])

  const handleFileChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'banner'
  ) => {
    const file = event.target.files?.[0]
    
    if (!file) return

    const error = validateFile(file, type)
    if (error) {
      setFileErrors(prev => ({ ...prev, [type]: error }))
      return
    }

    setFileErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[type]
      return newErrors
    })

    if (type === 'profile') {
      setProfileImage(file)
    } else {
      setBannerImage(file)
    }
  }, [validateFile])

  const onSubmit = useCallback(async (data: ApplicationFormData) => {
    try {
      // Upload files first if they exist
      let profileImageUrl = ''
      let bannerImageUrl = ''

      if (profileImage) {
        const uploadedProfile = await uploadFile(profileImage, 'image')
        profileImageUrl = uploadedProfile.url
      }

      if (bannerImage) {
        const uploadedBanner = await uploadFile(bannerImage, 'image')
        bannerImageUrl = uploadedBanner.url
      }

      // Submit application
      await submitApplication({
        id: '',
        channelName: data.channelName,
        description: data.description,
        socialMediaLinks: {
          youtube: data.youtubeUrl || undefined,
          twitter: data.twitterUrl || undefined,
          twitch: data.twitchUrl || undefined,
        },
        profileImage: profileImageUrl,
        bannerImage: bannerImageUrl,
        activityProof: [],
        status: 'draft',
      })

      // Reset form on success
      reset()
      setProfileImage(null)
      setBannerImage(null)
    } catch (_error) {
      console.error("Error:", _error)
    }
  }, [profileImage, bannerImage, uploadFile, submitApplication, reset])

  // Show success message if application is submitted
  if (applicationStatus.status === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-green-600">申請を受け付けました</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>VTuber申請が正常に送信されました。</p>
            <p className="text-sm text-gray-600">
              審査結果は通常3-5営業日以内にメールでお知らせいたします。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show current application status if under review/approved/rejected
  if (['under_review', 'approved', 'rejected'].includes(applicationStatus.status)) {
    const statusText = {
      under_review: '審査中',
      approved: '承認済み',
      rejected: '却下'
    }

    const statusColor = {
      under_review: 'text-yellow-600',
      approved: 'text-green-600',
      rejected: 'text-red-600'
    }

    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className={`text-center ${statusColor[applicationStatus.status]}`}>
              申請ステータス: {statusText[applicationStatus.status]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {applicationStatus.submittedAt && (
              <p className="text-center">
                {new Date(applicationStatus.submittedAt).toLocaleDateString('ja-JP')}に申請を受け付けました
              </p>
            )}
            {applicationStatus.rejectionReason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">却下理由:</h4>
                <p className="text-red-700">{applicationStatus.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VTuber申請</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Channel Name */}
            <div className="space-y-2">
              <Label htmlFor="channelName">チャンネル名 *</Label>
              <Input
                id="channelName"
                {...register('channelName')}
                placeholder="チャンネル名を入力してください"
              />
              {errors.channelName && (
                <p className="text-sm text-red-600">{errors.channelName.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">チャンネル説明 *</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="チャンネルの説明を入力してください"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-vertical"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">ソーシャルメディア</h3>
              
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input
                  id="youtubeUrl"
                  {...register('youtubeUrl')}
                  placeholder="https://youtube.com/@your-channel"
                />
                {errors.youtubeUrl && (
                  <p className="text-sm text-red-600">{errors.youtubeUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Input
                  id="twitterUrl"
                  {...register('twitterUrl')}
                  placeholder="https://twitter.com/your-handle"
                />
                {errors.twitterUrl && (
                  <p className="text-sm text-red-600">{errors.twitterUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitchUrl">Twitch URL</Label>
                <Input
                  id="twitchUrl"
                  {...register('twitchUrl')}
                  placeholder="https://twitch.tv/your-channel"
                />
                {errors.twitchUrl && (
                  <p className="text-sm text-red-600">{errors.twitchUrl.message}</p>
                )}
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">画像アップロード</h3>
              
              <div className="space-y-2">
                <Label htmlFor="profileImage">プロフィール画像</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileChange(e, 'profile')}
                />
                {fileErrors.profile && (
                  <p className="text-sm text-red-600">{fileErrors.profile}</p>
                )}
                {profileImage && (
                  <p className="text-sm text-green-600">プロフィール画像がアップロードされました</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">バナー画像</Label>
                <Input
                  id="bannerImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileChange(e, 'banner')}
                />
                {fileErrors.banner && (
                  <p className="text-sm text-red-600">{fileErrors.banner}</p>
                )}
                {bannerImage && (
                  <p className="text-sm text-green-600">バナー画像がアップロードされました</p>
                )}
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center space-x-2">
              <input
                id="agreesToTerms"
                type="checkbox"
                {...register('agreesToTerms')}
                className="h-4 w-4"
              />
              <Label htmlFor="agreesToTerms" className="text-sm">
                利用規約とプライバシーポリシーに同意します *
              </Label>
            </div>
            {errors.agreesToTerms && (
              <p className="text-sm text-red-600">{errors.agreesToTerms.message}</p>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? '送信中...' : '申請を送信'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}