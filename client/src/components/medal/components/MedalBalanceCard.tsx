import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMedalAmountWithUnit } from '@/lib/medal-utils'
import type { MedalBalance } from '@/types/medal'

interface MedalBalanceCardProps {
  balance: MedalBalance
}

export const MedalBalanceCard: React.FC<MedalBalanceCardProps> = ({ balance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>総メダル数</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatMedalAmountWithUnit(balance.totalMedals)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>使用可能メダル</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatMedalAmountWithUnit(balance.availableMedals)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>使用済みメダル</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatMedalAmountWithUnit(balance.usedMedals)}</p>
        </CardContent>
      </Card>
    </div>
  )
}