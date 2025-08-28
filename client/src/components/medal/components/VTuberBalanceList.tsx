import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMedalAmountWithUnit } from '@/lib/medal-utils'
import type { VTuberMedalBalance } from '@/types/medal'

interface VTuberBalanceListProps {
  balances: VTuberMedalBalance[]
}

interface VTuberBalanceItemProps {
  balance: VTuberMedalBalance
}

const VTuberBalanceItem: React.FC<VTuberBalanceItemProps> = ({ balance }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{balance.vtuberName}</span>
        <span className="font-bold">{formatMedalAmountWithUnit(balance.balance)}</span>
      </div>
      
      <button
        aria-label={`${balance.vtuberName}の詳細を表示`}
        className="text-sm text-blue-600 hover:underline"
        onClick={() => setExpanded(!expanded)}
      >
        詳細を表示
      </button>
      
      {expanded && (
        <div data-vtuber={balance.vtuberId} className="mt-2 text-sm">
          <p>獲得総数: {formatMedalAmountWithUnit(balance.totalEarned)}</p>
          <p>使用総数: {formatMedalAmountWithUnit(balance.totalUsed)}</p>
        </div>
      )}
    </div>
  )
}

export const VTuberBalanceList: React.FC<VTuberBalanceListProps> = ({ balances }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>VTuber別残高</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((balance) => (
            <VTuberBalanceItem key={balance.vtuberId} balance={balance} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}