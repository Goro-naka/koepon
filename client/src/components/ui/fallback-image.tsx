'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FallbackImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  fallbackSrc?: string
}

export function FallbackImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  fallbackSrc = '/images/default-placeholder.svg'
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={hasError}
    />
  )
}