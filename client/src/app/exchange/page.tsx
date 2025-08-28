'use client'

import { ExchangePage } from '@/components/medal/ExchangePage'
import { Header } from '@/components/layout/header'
import { Container } from '@/components/layout/container'

export default function ExchangePageWrapper() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Container className="py-6">
        <ExchangePage />
      </Container>
    </div>
  )
}