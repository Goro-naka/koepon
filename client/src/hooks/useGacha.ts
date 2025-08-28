import { useState, useEffect } from 'react'
import { useGachaStore } from '@/stores/gacha'
import type { GachaDetail } from '@/types/gacha'

export function useGacha(gachaId?: string) {
  const { selectedGacha, selectedGachaLoading, selectedGachaError, fetchGachaDetail } = useGachaStore()
  
  useEffect(() => {
    if (gachaId) {
      fetchGachaDetail(gachaId)
    }
  }, [gachaId, fetchGachaDetail])

  return {
    gacha: selectedGacha,
    loading: selectedGachaLoading,
    error: selectedGachaError
  }
}