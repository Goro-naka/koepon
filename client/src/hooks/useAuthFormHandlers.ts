import { useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'

export function useAuthFormHandlers() {
  const authStore = useAuthStore()
  const { error } = authStore

  const clearError = useCallback(() => {
    if (error && typeof authStore.clearError === 'function') {
      authStore.clearError()
    }
  }, [error, authStore])

  const handleInputChange = useCallback(() => {
    clearError()
  }, [clearError])

  return {
    handleInputChange,
    clearError,
  }
}