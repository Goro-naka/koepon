'use client'

import { FallbackImage } from './fallback-image'

interface VTuberAvatarProps {
  vtuberName: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  width?: number
  height?: number
  className?: string
}

const sizeConfig = {
  sm: { width: 40, height: 40, className: 'w-10 h-10' },
  md: { width: 60, height: 60, className: 'w-15 h-15' },
  lg: { width: 80, height: 80, className: 'w-20 h-20' },
  xl: { width: 120, height: 120, className: 'w-30 h-30' }
}

export function VTuberAvatar({ 
  vtuberName, 
  size = 'md',
  width,
  height,
  className = ''
}: VTuberAvatarProps) {
  const config = sizeConfig[size]
  const finalWidth = width || config.width
  const finalHeight = height || config.height
  // 開発中: プレースホルダー画像を使用
  const avatarSrc = '/avatars/placeholder.svg'
  
  return (
    <FallbackImage
      src={avatarSrc}
      alt={`${vtuberName}のアバター`}
      width={finalWidth}
      height={finalHeight}
      className={`${width && height ? '' : config.className} rounded-full object-cover ${className}`}
      fallbackSrc="/avatars/placeholder.svg"
    />
  )
}