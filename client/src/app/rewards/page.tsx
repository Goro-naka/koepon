'use client'

import { RewardsBoxPage } from '@/components/reward/RewardsBoxPage'
import { Header } from '@/components/layout/header'

export default function RewardsPageWrapper() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <RewardsBoxPage />
    </div>
  )
}