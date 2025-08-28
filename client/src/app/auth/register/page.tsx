'use client'

import { RegisterForm } from '@/components/auth/RegisterForm'
import { Header } from '@/components/layout/header'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container max-w-md mx-auto pt-20">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">会員登録</h1>
        <RegisterForm />
      </div>
    </div>
  )
}