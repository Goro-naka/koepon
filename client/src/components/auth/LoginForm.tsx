'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { loginSchema, type LoginFormData } from '@/lib/validation-schemas'
import { useAuthStore } from '@/stores/auth'
import { useAuthFormHandlers } from '@/hooks/useAuthFormHandlers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordToggleButton } from './PasswordToggleButton'
import { FormErrorAlert } from './FormErrorAlert'

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading, error } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const { handleInputChange } = useAuthFormHandlers()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      router.push('/') // Redirect to home page after login
    } catch {
      // Error handled by store
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="text-gray-600">こえポン！にログインしてください</p>
      </div>

      <FormErrorAlert error={error} />

      <form 
        aria-label="ログイン"
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
            <PasswordToggleButton
              showPassword={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="rememberMe" 
            {...register('rememberMe')}
          />
          <Label 
            htmlFor="rememberMe"
            className="text-sm font-normal cursor-pointer"
          >
            ログイン状態を保持する
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-testid="loading-spinner" />
              ログイン中...
            </>
          ) : (
            'ログイン'
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <Link 
          href="/password-reset"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          パスワードを忘れた方はこちら
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