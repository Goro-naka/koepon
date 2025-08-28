'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2, X, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { passwordResetSchema, type PasswordResetFormData } from '@/lib/validation-schemas'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function PasswordResetForm() {
  const authStore = useAuthStore()
  const { resetPassword, isLoading, error } = authStore
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: PasswordResetFormData) => {
    try {
      await resetPassword(data)
      setEmailSent(data.email)
      setIsSuccess(true)
    } catch {
      // Error handled by store
    }
  }

  const handleInputChange = () => {
    if (error && typeof authStore.clearError === 'function') {
      authStore.clearError()
    }
  }

  const handleClear = () => {
    const form = document.getElementById('email') as HTMLInputElement
    if (form) {
      form.value = ''
    }
  }

  const handleResend = async () => {
    const email = emailSent
    if (email) {
      try {
        await resetPassword({ email })
      } catch {
        // Error handled by store
      }
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">メール送信完了</h1>
          <p className="text-gray-600">
            パスワードリセット用のメールを送信しました
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h2 className="font-medium text-blue-800 mb-2">メールをご確認ください</h2>
          <p className="text-sm text-blue-700 mb-3">
            <strong>{emailSent}</strong> にパスワードリセット用のリンクを送信しました。
            メールに記載されたリンクをクリックしてパスワードをリセットしてください。
          </p>
          <p className="text-sm text-blue-600">
            メールが届かない場合は、迷惑メールフォルダもご確認ください。
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
                送信中...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                メールを再送信
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link 
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ログインに戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">パスワードリセット</h1>
        <p className="text-gray-600">
          登録済みのメールアドレスを入力してください
        </p>
        <p className="text-sm text-gray-700">
          パスワードリセット用のリンクをお送りします
        </p>
      </div>

      {error && (
        <div 
          role="alert"
          className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
        >
          {error}
        </div>
      )}

      <form 
        aria-label="パスワードリセット"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              required
              placeholder="例: user@example.com"
              {...register('email')}
              onChange={(e) => {
                register('email').onChange(e)
                handleInputChange()
              }}
              className={errors.email ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={handleClear}
              aria-label="クリア"
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
              送信中...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              リセットメールを送信
            </>
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <Link 
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          ログインに戻る
        </Link>
        <p className="text-sm text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            こちらから登録
          </Link>
        </p>
      </div>
    </div>
  )
}