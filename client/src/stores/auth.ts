import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  username: string
  displayName?: string
  role: 'USER' | 'VTUBER' | 'ADMIN'
  avatarUrl?: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  username: string
  displayName?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  validateToken: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          error: null,
        }),
        
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),
        
      setLoading: (isLoading) => set({ isLoading }),
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
        
      clearError: () => set({ error: null }),
      
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })
          
          if (!response.ok) {
            throw new Error('ログインに失敗しました')
          }
          
          const data = await response.json()
          get().setAuth(data.user, data.accessToken, data.refreshToken)
        } catch (_error) {
          set({ 
            error: _error instanceof Error ? _error.message : 'ログインに失敗しました',
            isAuthenticated: false
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      register: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          })
          
          if (!response.ok) {
            throw new Error('新規登録に失敗しました')
          }
          
          // 登録後は認証メール送信などの処理があるため、自動ログインは行わない
        } catch (_error) {
          set({ 
            error: _error instanceof Error ? _error.message : '新規登録に失敗しました'
          })
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      logout: async () => {
        set({ isLoading: true })
        
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${get().accessToken}`,
            },
          })
        } catch (_error) {
          console.error("Error:", _error)
        } finally {
          get().clearAuth()
          set({ isLoading: false })
        }
      },
      
      validateToken: async () => {
        const { accessToken } = get()
        if (!accessToken) return
        
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          })
          
          if (!response.ok) {
            throw new Error('Token validation failed')
          }
          
          const data = await response.json()
          if (data.user) {
            set({ user: data.user, isAuthenticated: true })
          } else {
            get().clearAuth()
          }
        } catch (_error) {
          console.error("Error:", _error)
          get().clearAuth()
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)