'use client'

import { ExchangePage } from '@/components/medal/ExchangePage'
import { Header } from '@/components/layout/header'

export default function ExchangePageWrapper() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <ExchangePage />
    </div>
  )
}