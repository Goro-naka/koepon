'use client'

import { GachaDetailPage } from '@/components/gacha/GachaDetailPage'
import { Header } from '@/components/layout/header'
import { useParams } from 'next/navigation'

export default function GachaDetailPageWrapper() {
  const params = useParams()
  const id = params.id as string

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <GachaDetailPage id={id} />
    </div>
  )
}