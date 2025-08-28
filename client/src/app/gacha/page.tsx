'use client'

import { GachaListPage } from '@/components/gacha/GachaListPage'
import { Header } from '@/components/layout/header'

export default function GachaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <GachaListPage />
    </div>
  )
}