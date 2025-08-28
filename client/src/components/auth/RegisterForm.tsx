'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { registerSchema, type RegisterFormData } from '@/lib/validation-schemas'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export function RegisterForm() {
  const router = useRouter()
  const authStore = useAuthStore()
  const { register: registerUser, isLoading, error } = authStore
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      agreeToPrivacy: false,
      agreeToMarketing: false,
    },
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        username: data.email, // Use email as username for now
        displayName: data.displayName,
      })
      router.push('/auth/verify-email')
    } catch {
      // Error handled by store
    }
  }

  const handleInputChange = () => {
    if (error && typeof authStore.clearError === 'function') {
      authStore.clearError()
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length < 8) return { strength: 'weak', text: '弱い', color: 'text-red-500' }
    if (password.length < 12) return { strength: 'medium', text: '普通', color: 'text-yellow-500' }
    return { strength: 'strong', text: '強い', color: 'text-green-500' }
  }

  const passwordStrength = getPasswordStrength(password || '')


  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">アカウント作成</h1>
        <p className="text-gray-600">こえポン！のアカウントを作成してください</p>
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
        aria-label="アカウント作成"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            required
            {...register('email')}
            onChange={(e) => {
              register('email').onChange(e)
              handleInputChange()
            }}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">表示名（任意）</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="例: 推しVTuberファン"
            {...register('displayName')}
            onChange={(e) => {
              register('displayName').onChange(e)
              handleInputChange()
            }}
            className={errors.displayName ? 'border-red-500' : ''}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              {...register('password')}
              onChange={(e) => {
                register('password').onChange(e)
                handleInputChange()
              }}
              className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {password && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">強度:</span>
              <span className={`text-sm font-medium ${passwordStrength.color}`}>
                {passwordStrength.text}
              </span>
            </div>
          )}
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード確認</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              {...register('confirmPassword')}
              onChange={(e) => {
                register('confirmPassword').onChange(e)
                handleInputChange()
              }}
              className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'パスワード確認を隠す' : 'パスワード確認を表示'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>


        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agreeToTerms" 
              {...register('agreeToTerms')}
            />
            <Label 
              htmlFor="agreeToTerms"
              className="text-sm font-normal cursor-pointer"
            >
              <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                利用規約
              </Link>
              に同意します
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agreeToPrivacy" 
              {...register('agreeToPrivacy')}
            />
            <Label 
              htmlFor="agreeToPrivacy"
              className="text-sm font-normal cursor-pointer"
            >
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                プライバシーポリシー
              </Link>
              に同意します
            </Label>
          </div>
          {errors.agreeToPrivacy && (
            <p className="text-sm text-red-600">{errors.agreeToPrivacy.message}</p>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agreeToMarketing" 
              {...register('agreeToMarketing')}
            />
            <Label 
              htmlFor="agreeToMarketing"
              className="text-sm font-normal cursor-pointer"
            >
              マーケティング情報の受信に同意します（任意）
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
              作成中...
            </>
          ) : (
            'アカウント作成'
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            こちらからログイン
          </Link>
        </p>
      </div>
    </div>
  )
}