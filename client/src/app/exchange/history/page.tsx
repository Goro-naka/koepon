'use client'

import { ExchangeHistoryPage } from '@/components/medal/ExchangeHistoryPage'
import { Header } from '@/components/layout/header'

export default function ExchangeHistoryPageWrapper() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <ExchangeHistoryPage />
    </div>
  )
}