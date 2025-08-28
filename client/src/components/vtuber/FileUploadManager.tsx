import React, { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useVTuberStore } from '@/stores/vtuber'
import type { FileType } from '@/types/vtuber'

interface FileUploadManagerProps {
  onFileUploaded?: (file: any) => void
  allowedTypes?: FileType[]
  maxFileSize?: number
}

export const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  onFileUploaded,
  allowedTypes = ['image'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [fileError, setFileError] = useState<string>('')

  const { uploadFile, isLoading } = useVTuberStore()

  const validateFile = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (!validTypes.includes(file.type)) {
      return '画像ファイル（JPG、PNG、WebP）のみアップロード可能です'
    }

    if (file.size > maxFileSize) {
      return `ファイルサイズは${Math.round(maxFileSize / (1024 * 1024))}MB以下にしてください`
    }

    return null
  }, [maxFileSize])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return

    const error = validateFile(file)
    if (error) {
      setFileError(error)
      return
    }

    setFileError('')
    setSelectedFile(file)
  }, [validateFile])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    try {
      setUploadProgress(0)
      const uploadedFile = await uploadFile(selectedFile, allowedTypes[0])
      setUploadProgress(100)
      onFileUploaded?.(uploadedFile)
      setSelectedFile(null)
    } catch (_error) {
      console.error("Error:", _error)
      setFileError('アップロードに失敗しました')
    }
  }, [selectedFile, uploadFile, allowedTypes, onFileUploaded])

  return (
    <Card>
      <CardHeader>
        <CardTitle>ファイルアップロード</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">ファイルを選択</Label>
          <Input
            id="file-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
          />
          {fileError && (
            <p className="text-sm text-red-600">{fileError}</p>
          )}
        </div>

        {selectedFile && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-600">
                {Math.round(selectedFile.size / 1024)}KB
              </p>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  アップロード中... {uploadProgress}%
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={isLoading || uploadProgress === 100}
              className="w-full"
            >
              {isLoading ? 'アップロード中...' : 'アップロード'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}