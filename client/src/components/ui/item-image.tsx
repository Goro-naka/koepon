'use client'

import { FallbackImage } from './fallback-image'

interface ItemImageProps {
  itemId: string
  itemName: string
  width?: number
  height?: number
  className?: string
}

export function ItemImage({ 
  itemId,
  itemName,
  width = 200,
  height = 200,
  className = ''
}: ItemImageProps) {
  const itemSrc = `/items/${itemId}.jpg`
  
  return (
    <FallbackImage
      src={itemSrc}
      alt={itemName}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      fallbackSrc="/images/default-placeholder.svg"
    />
  )
}