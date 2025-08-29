import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/api/client'
import type {
  AdminDashboardMetrics,
  VTuberApplicationReview,
  SystemMetrics,
  ApiMetrics,
  AdminUserView,
  UserDetailView,
  AdminAction,
  AdminFilters,
  SystemAlert,
} from '@/types/admin'

export interface AdminStore {
  // Dashboard State
  dashboardMetrics: AdminDashboardMetrics | null
  systemStatus: {
    server: 'healthy' | 'warning' | 'critical'
    database: 'connected' | 'disconnected'
    redis: 'connected' | 'disconnected'
    uptime: number
  } | null
  
  // VTuber Applications State
  applications: VTuberApplicationReview[]
  selectedApplication: VTuberApplicationReview | null
  selectedApplicationIds: string[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  } | null
  
  // System Monitoring State
  systemMetrics: SystemMetrics[]
  apiMetrics: ApiMetrics[]
  errorLogs: {
    id: string
    timestamp: string
    level: 'error' | 'warning' | 'info'
    message: string
    source: string
    stack?: string
  }[]
  alerts: SystemAlert[]
  isConnected: boolean
  
  // User Management State
  users: AdminUserView[]
  selectedUser: UserDetailView | null
  
  // UI State
  filters: AdminFilters
  loading: Record<string, boolean>
  errors: Record<string, string>
  isLoading: boolean
  error: string | null
  
  // Dashboard Actions
  fetchDashboardMetrics: (period: string) => Promise<void>
  fetchSystemStatus: () => Promise<void>
  
  // VTuber Application Actions
  fetchApplications: (filters: AdminFilters) => Promise<void>
  reviewApplication: (id: string, action: AdminAction) => Promise<void>
  selectApplication: (application: VTuberApplicationReview | null) => void
  selectApplicationIds: (ids: string[]) => void
  
  // System Monitoring Actions
  fetchSystemMetrics: () => Promise<void>
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
  
  // User Management Actions
  fetchUsers: (filters: AdminFilters) => Promise<void>
  performUserAction: (userId: string, action: AdminAction) => Promise<void>
  selectUser: (userId: string) => Promise<void>
  
  // VTuber CRUD Actions
  createVTuber: (data: any) => Promise<boolean>
  updateVTuber: (id: string, data: any) => Promise<boolean>
  deleteVTuber: (id: string) => Promise<boolean>
  
  // Gacha CRUD Actions
  createGacha: (data: any) => Promise<boolean>
  updateGacha: (id: string, data: any) => Promise<boolean>
  deleteGacha: (id: string) => Promise<boolean>
  
  // Utility Actions
  clearErrors: () => void
  setLoading: (key: string, loading: boolean) => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      // Initial State
      dashboardMetrics: null,
      systemStatus: null,
      applications: [],
      selectedApplication: null,
      selectedApplicationIds: [],
      pagination: null,
      systemMetrics: [],
      apiMetrics: [],
      errorLogs: [],
      alerts: [],
      isConnected: false,
      users: [],
      selectedUser: null,
      filters: {
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }
      },
      loading: {},
      errors: {},
      isLoading: false,
      error: null,

      // Dashboard Actions
      fetchDashboardMetrics: async (period: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/admin/dashboard/metrics', {
            params: { period }
          })
          set({
            dashboardMetrics: response.data,
            isLoading: false,
            error: null,
            errors: { ...get().errors, dashboard: undefined },
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ダッシュボードデータの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            dashboardMetrics: null,
            isLoading: false,
            errors: { ...get().errors, dashboard: errorMessage },
          })
        }
      },

      fetchSystemStatus: async () => {
        try {
          const response = await apiClient.get('/api/admin/system/status')
          set({ systemStatus: response.data })
        } catch (_error) {
          console.error("Error:", _error)
        }
      },

      // VTuber Application Actions
      fetchApplications: async (filters: AdminFilters) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/admin/vtuber-applications', {
            params: filters
          })
          set({
            applications: response.data,
            filters,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : '申請データの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            applications: [],
            isLoading: false,
            errors: { ...get().errors, applications: errorMessage },
          })
        }
      },

      reviewApplication: async (id: string, action: AdminAction) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post(`/api/admin/vtuber-applications/${id}/review`, action)
          
          // Update the application in the list
          const currentApplications = get().applications
          const updatedApplications = currentApplications.map(app =>
            app.id === id ? { ...app, status: response.data.status } : app
          )
          
          set({
            applications: updatedApplications,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : '審査処理に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, review: errorMessage },
          })
        }
      },

      selectApplication: (application: VTuberApplicationReview | null) => {
        set({ selectedApplication: application })
      },

      selectApplicationIds: (ids: string[]) => {
        set({ selectedApplicationIds: ids })
      },

      // System Monitoring Actions
      fetchSystemMetrics: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/admin/system/metrics')
          set({
            systemMetrics: response.data,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'システムメトリクスの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            systemMetrics: [],
            isLoading: false,
            errors: { ...get().errors, metrics: errorMessage },
          })
        }
      },

      subscribeToUpdates: () => {
        // TODO: Implement WebSocket or SSE connection
        set({ isConnected: true })
      },

      unsubscribeFromUpdates: () => {
        // TODO: Implement connection cleanup
        set({ isConnected: false })
      },

      // User Management Actions
      fetchUsers: async (filters: AdminFilters) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/admin/users', {
            params: filters
          })
          set({
            users: response.data,
            filters,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ユーザーデータの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            users: [],
            isLoading: false,
            errors: { ...get().errors, users: errorMessage },
          })
        }
      },

      performUserAction: async (userId: string, action: AdminAction) => {
        set({ isLoading: true, error: null })
        try {
          let endpoint = ''
          switch (action.type) {
            case 'user_suspend':
              endpoint = `/api/admin/users/${userId}/suspend`
              break
            case 'user_restore':
              endpoint = `/api/admin/users/${userId}/restore`
              break
            case 'medal_adjust':
              endpoint = `/api/admin/users/${userId}/adjust-medals`
              break
            default:
              throw new Error(`Unknown action type: ${action.type}`)
          }
          
          await apiClient.post(endpoint, action)
          
          // Update user status optimistically
          const currentUsers = get().users
          const updatedUsers = currentUsers.map(user => {
            if (user.id === userId) {
              if (action.type === 'user_suspend') {
                return { ...user, status: 'suspended' as const }
              } else if (action.type === 'user_restore') {
                return { ...user, status: 'active' as const }
              }
            }
            return user
          })
          
          set({
            users: updatedUsers,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ユーザー操作に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, userAction: errorMessage },
          })
        }
      },

      selectUser: async (userId: string) => {
        try {
          const response = await apiClient.get(`/api/admin/users/${userId}`)
          set({ selectedUser: response.data })
        } catch (_error) {
          console.error("Error:", _error)
        }
      },

      // VTuber CRUD Actions
      createVTuber: async (data: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post('/api/admin/vtubers', data)
          set({ isLoading: false, error: null })
          return response.data?.success || true
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'VTuber作成に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, vtuberCreate: errorMessage },
          })
          return false
        }
      },

      updateVTuber: async (id: string, data: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post(`/api/admin/vtubers/${id}`, data)
          set({ isLoading: false, error: null })
          return response.data?.success || true
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'VTuber更新に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, vtuberUpdate: errorMessage },
          })
          return false
        }
      },

      deleteVTuber: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.delete(`/api/admin/vtubers/${id}`)
          set({ isLoading: false, error: null })
          return response.data?.success || true
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'VTuber削除に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, vtuberDelete: errorMessage },
          })
          return false
        }
      },

      // Gacha CRUD Actions
      createGacha: async (data: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post('/api/admin/gacha', data)
          set({ isLoading: false, error: null })
          return response.data?.success || true
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャ作成に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, gachaCreate: errorMessage },
          })
          return false
        }
      },

      updateGacha: async (id: string, data: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post(`/api/admin/gacha/${id}`, data)
          set({ isLoading: false, error: null })
          return response.data?.success || true
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャ更新に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, gachaUpdate: errorMessage },
          })
          return false
        }
      },

      deleteGacha: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.delete(`/api/admin/gacha/${id}`)
          set({ isLoading: false, error: null })
          return response.data?.success || true
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャ削除に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            errors: { ...get().errors, gachaDelete: errorMessage },
          })
          return false
        }
      },

      // Utility Actions
      clearErrors: () => {
        set({ errors: {} })
      },

      setLoading: (key: string, loading: boolean) => {
        set(state => ({
          loading: { ...state.loading, [key]: loading }
        }))
      },
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
)