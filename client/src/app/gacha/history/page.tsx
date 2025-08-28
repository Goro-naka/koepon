'use client'

import { GachaHistoryPage } from '@/components/gacha/GachaHistoryPage'
import { Header } from '@/components/layout/header'

export default function GachaHistoryPageWrapper() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <GachaHistoryPage />
    </div>
  )
}