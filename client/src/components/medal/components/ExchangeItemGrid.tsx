import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ItemImage } from '@/components/ui/item-image'
import { formatMedalAmountWithUnit, getExchangeCategoryName } from '@/lib/medal-utils'
import type { ExchangeItem } from '@/types/medal'

interface ExchangeItemGridProps {
  items: ExchangeItem[]
  onExchangeClick: (itemId: string) => void
  checkSufficientBalance: (cost: number) => boolean
}

interface ExchangeItemCardProps {
  item: ExchangeItem
  onExchangeClick: (itemId: string) => void
  canAfford: boolean
}

const ExchangeItemCard: React.FC<ExchangeItemCardProps> = ({ 
  item, 
  onExchangeClick, 
  canAfford 
}) => {
  const isOutOfStock = !item.isAvailable || (item.stock !== null && item.stock <= 0)

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <ItemImage
          itemId={item.id}
          itemName={item.name}
          width={300}
          height={200}
          className="w-full h-full"
        />
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg">{item.name}</CardTitle>
        <p className="text-sm text-gray-600">{item.vtuberName}</p>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <p className="text-sm">{item.description}</p>
        <p className="font-bold">{formatMedalAmountWithUnit(item.cost)}</p>
        
        <div className="flex justify-between text-sm">
          <span>カテゴリ: {getExchangeCategoryName(item.category)}</span>
          <span>
            在庫: {item.stock === null ? '制限なし' : item.stock}
          </span>
        </div>

        {!canAfford && (
          <p className="text-red-600 text-sm">メダル不足</p>
        )}

        <Button
          className="w-full"
          disabled={!canAfford || isOutOfStock}
          onClick={() => onExchangeClick(item.id)}
        >
          {isOutOfStock ? '在庫切れ' : '交換する'}
        </Button>
      </CardContent>
    </Card>
  )
}

export const ExchangeItemGrid: React.FC<ExchangeItemGridProps> = ({ 
  items, 
  onExchangeClick, 
  checkSufficientBalance 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => {
        const canAfford = checkSufficientBalance(item.cost)

        return (
          <ExchangeItemCard
            key={item.id}
            item={item}
            onExchangeClick={onExchangeClick}
            canAfford={canAfford}
          />
        )
      })}
    </div>
  )
}