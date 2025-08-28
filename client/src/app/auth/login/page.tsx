'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import { Header } from '@/components/layout/header'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container max-w-md mx-auto pt-20">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">ログイン</h1>
        <LoginForm />
      </div>
    </div>
  )
}