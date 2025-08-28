'use client'

import { RewardsBoxPage } from '@/components/reward/RewardsBoxPage'
import { Header } from '@/components/layout/header'
import { Container } from '@/components/layout/container'

export default function RewardsPageWrapper() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Container className="py-6">
        <RewardsBoxPage />
      </Container>
    </div>
  )
}