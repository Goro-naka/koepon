import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/api/client'
import type {
  VTuberInfo,
  VTuberApplication,
  ApplicationStatus,
  GachaManagementData,
  CreateGachaRequest,
  UpdateGachaRequest,
  DashboardMetrics,
  StatisticsData,
  UploadedFile,
  FileType,
  DateRange,
} from '@/types/vtuber'

export interface VTuberStore {
  // State
  vtuberInfo: VTuberInfo | null
  applicationStatus: ApplicationStatus
  gachaList: GachaManagementData[]
  dashboardMetrics: DashboardMetrics | null
  statisticsData: StatisticsData | null
  uploadedFiles: UploadedFile[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchVTuberInfo: () => Promise<void>
  updateVTuberInfo: (info: Partial<VTuberInfo>) => Promise<void>
  submitApplication: (application: VTuberApplication) => Promise<void>
  fetchGachaList: () => Promise<void>
  createGacha: (gacha: CreateGachaRequest) => Promise<void>
  updateGacha: (gachaId: string, gacha: UpdateGachaRequest) => Promise<void>
  deleteGacha: (gachaId: string) => Promise<void>
  uploadFile: (file: File, type: FileType) => Promise<UploadedFile>
  fetchDashboardMetrics: () => Promise<void>
  fetchStatisticsData: (dateRange: DateRange) => Promise<void>
}

export const useVTuberStore = create<VTuberStore>()(
  persist(
    (set, get) => ({
      // Initial state
      vtuberInfo: null,
      applicationStatus: { status: 'draft' },
      gachaList: [],
      dashboardMetrics: null,
      statisticsData: null,
      uploadedFiles: [],
      isLoading: false,
      error: null,

      // VTuber info actions
      fetchVTuberInfo: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/vtuber/info')
          set({
            vtuberInfo: response.data,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'VTuber情報の取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            vtuberInfo: null,
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      updateVTuberInfo: async (info: Partial<VTuberInfo>) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.put('/api/vtuber/info', info)
          set({
            vtuberInfo: response.data,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'VTuber情報の更新に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      // Application actions
      submitApplication: async (application: VTuberApplication) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post('/api/vtuber/application', application)
          set({
            applicationStatus: {
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            },
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : '申請の送信に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      // Gacha actions
      fetchGachaList: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/vtuber/gacha')
          set({
            gachaList: response.data,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャリストの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            gachaList: [],
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      createGacha: async (gacha: CreateGachaRequest) => {
        set({ isLoading: true, error: null })
        try {
          const formData = new FormData()
          formData.append('title', gacha.title)
          formData.append('description', gacha.description)
          formData.append('price', gacha.price.toString())
          formData.append('startDate', gacha.startDate)
          formData.append('endDate', gacha.endDate)
          formData.append('thumbnailImage', gacha.thumbnailImage)
          formData.append('items', JSON.stringify(gacha.items))

          const response = await apiClient.post('/api/vtuber/gacha', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          
          const currentGachaList = get().gachaList
          set({
            gachaList: [...currentGachaList, response.data],
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャの作成に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      updateGacha: async (gachaId: string, gacha: UpdateGachaRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.put(`/api/vtuber/gacha/${gachaId}`, gacha)
          
          const currentGachaList = get().gachaList
          const updatedGachaList = currentGachaList.map(g =>
            g.id === gachaId ? response.data : g
          )
          
          set({
            gachaList: updatedGachaList,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャの更新に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      deleteGacha: async (gachaId: string) => {
        set({ isLoading: true, error: null })
        try {
          await apiClient.delete(`/api/vtuber/gacha/${gachaId}`)
          
          const currentGachaList = get().gachaList
          const filteredGachaList = currentGachaList.filter(g => g.id !== gachaId)
          
          set({
            gachaList: filteredGachaList,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ガチャの削除に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      // File upload actions
      uploadFile: async (file: File, type: FileType) => {
        set({ isLoading: true, error: null })
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', type)

          const response = await apiClient.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })

          const uploadedFile: UploadedFile = {
            id: response.data.id,
            name: response.data.name,
            size: response.data.size,
            type: response.data.type,
            url: response.data.url,
            thumbnailUrl: response.data.thumbnailUrl,
            uploadedAt: response.data.uploadedAt,
          }

          const currentFiles = get().uploadedFiles
          set({
            uploadedFiles: [...currentFiles, uploadedFile],
            isLoading: false,
            error: null,
          })

          return uploadedFile
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ファイルのアップロードに失敗しました'
          
          console.error("Error:", _error)
          
          set({
            isLoading: false,
            error: errorMessage,
          })

          throw error
        }
      },

      // Dashboard actions
      fetchDashboardMetrics: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/vtuber/dashboard/metrics')
          set({
            dashboardMetrics: response.data,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : 'ダッシュボードデータの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            dashboardMetrics: null,
            isLoading: false,
            error: errorMessage,
          })
        }
      },

      // Statistics actions
      fetchStatisticsData: async (dateRange: DateRange) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.get('/api/vtuber/statistics', {
            params: dateRange
          })
          set({
            statisticsData: response.data,
            isLoading: false,
            error: null,
          })
        } catch (_error) {
          const errorMessage = _error instanceof Error
            ? _error.message
            : '統計データの取得に失敗しました'
          
          console.error("Error:", _error)
          
          set({
            statisticsData: null,
            isLoading: false,
            error: errorMessage,
          })
        }
      },
    }),
    {
      name: 'vtuber-store',
      partialize: (state) => ({
        vtuberInfo: state.vtuberInfo,
        applicationStatus: state.applicationStatus,
      }),
    }
  )
)