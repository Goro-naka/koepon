import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VTuberApplicationPage } from '../VTuberApplicationPage'
import { useVTuberStore } from '@/stores/vtuber'
import type { VTuberApplication } from '@/types/vtuber'

// Mock the VTuber store
jest.mock('@/stores/vtuber')
const mockUseVTuberStore = useVTuberStore as jest.MockedFunction<typeof useVTuberStore>

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}))

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

const MockedProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockApplication: VTuberApplication = {
  id: 'app-1',
  channelName: 'テストVTuber',
  description: 'テスト用VTuberチャンネル',
  socialMediaLinks: {
    youtube: 'https://youtube.com/@testvtuber',
    twitter: 'https://twitter.com/testvtuber',
  },
  profileImage: 'https://example.com/profile.jpg',
  bannerImage: 'https://example.com/banner.jpg',
  activityProof: [],
  status: 'draft',
}

describe('VTuberApplicationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render application form with all required fields', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      expect(screen.getByText('VTuber申請')).toBeInTheDocument()
      expect(screen.getByLabelText('チャンネル名')).toBeInTheDocument()
      expect(screen.getByLabelText('チャンネル説明')).toBeInTheDocument()
      expect(screen.getByLabelText('YouTube URL')).toBeInTheDocument()
      expect(screen.getByLabelText('プロフィール画像')).toBeInTheDocument()
      expect(screen.getByText('申請を送信')).toBeInTheDocument()
    })

    it('should display current application status when exists', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: {
          status: 'under_review',
          submittedAt: '2024-01-15T10:00:00.000Z',
        },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      expect(screen.getByText('審査中')).toBeInTheDocument()
      expect(screen.getByText('2024年1月15日に申請を受け付けました')).toBeInTheDocument()
    })

    it('should show empty form for new application', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      const channelNameInput = screen.getByLabelText('チャンネル名') as HTMLInputElement
      const descriptionInput = screen.getByLabelText('チャンネル説明') as HTMLTextAreaElement
      
      expect(channelNameInput.value).toBe('')
      expect(descriptionInput.value).toBe('')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const mockSubmit = jest.fn()
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: mockSubmit,
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      const submitButton = screen.getByText('申請を送信')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('チャンネル名を入力してください')).toBeInTheDocument()
        expect(screen.getByText('チャンネル説明を入力してください')).toBeInTheDocument()
      })
      
      expect(mockSubmit).not.toHaveBeenCalled()
    })

    it('should validate channel name format and length', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      const channelNameInput = screen.getByLabelText('チャンネル名')
      
      // Too short
      fireEvent.change(channelNameInput, { target: { value: 'ab' } })
      fireEvent.blur(channelNameInput)

      await waitFor(() => {
        expect(screen.getByText('チャンネル名は3文字以上で入力してください')).toBeInTheDocument()
      })

      // Too long
      fireEvent.change(channelNameInput, { target: { value: 'a'.repeat(51) } })
      fireEvent.blur(channelNameInput)

      await waitFor(() => {
        expect(screen.getByText('チャンネル名は50文字以内で入力してください')).toBeInTheDocument()
      })
    })

    it('should validate social media URLs format', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      const youtubeInput = screen.getByLabelText('YouTube URL')
      
      fireEvent.change(youtubeInput, { target: { value: 'invalid-url' } })
      fireEvent.blur(youtubeInput)

      await waitFor(() => {
        expect(screen.getByText('有効なYouTube URLを入力してください')).toBeInTheDocument()
      })
    })

    it('should validate file upload requirements', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      // This test will fail because file upload validation is not implemented yet
      const fileInput = screen.getByLabelText('プロフィール画像')
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } })

      await waitFor(() => {
        expect(screen.getByText('画像ファイル（JPG、PNG）のみアップロード可能です')).toBeInTheDocument()
      })
    })

    it('should show validation errors in real-time', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      const channelNameInput = screen.getByLabelText('チャンネル名')
      
      fireEvent.change(channelNameInput, { target: { value: 'ab' } })
      fireEvent.blur(channelNameInput)

      await waitFor(() => {
        expect(screen.getByText('チャンネル名は3文字以上で入力してください')).toBeInTheDocument()
      })

      // Error should disappear when valid input is provided
      fireEvent.change(channelNameInput, { target: { value: 'Valid Channel Name' } })
      fireEvent.blur(channelNameInput)

      await waitFor(() => {
        expect(screen.queryByText('チャンネル名は3文字以上で入力してください')).not.toBeInTheDocument()
      })
    })
  })

  describe('File Upload', () => {
    it('should upload profile image successfully', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        id: 'file-1',
        name: 'profile.jpg',
        url: 'https://example.com/profile.jpg'
      })
      
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: mockUpload,
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      // This test will fail because file upload is not implemented yet
      const fileInput = screen.getByLabelText('プロフィール画像')
      const validFile = new File(['test'], 'profile.jpg', { type: 'image/jpeg' })
      
      fireEvent.change(fileInput, { target: { files: [validFile] } })

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(validFile, 'image')
        expect(screen.getByText('プロフィール画像がアップロードされました')).toBeInTheDocument()
      })
    })

    it('should display upload progress', async () => {
      // This test will fail because upload progress is not implemented
      expect(screen.getByTestId('upload-progress')).toBeInTheDocument()
    })

    it('should handle upload errors gracefully', async () => {
      // This test will fail because error handling is not implemented
      expect(screen.getByText('アップロードに失敗しました')).toBeInTheDocument()
    })
  })

  describe('Application Process', () => {
    it('should submit application successfully', async () => {
      const mockSubmit = jest.fn()
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'draft' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: mockSubmit,
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <VTuberApplicationPage />
        </MockedProvider>
      )

      // Fill out the form
      fireEvent.change(screen.getByLabelText('チャンネル名 *'), { target: { value: 'Test Channel' } })
      fireEvent.change(screen.getByLabelText('チャンネル説明 *'), { target: { value: 'Test Description' } })
      
      const submitButton = screen.getByText('申請を送信')
      fireEvent.click(submitButton)

      // This will fail because the form submission is not implemented
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled()
        expect(screen.getByText('申請を受け付けました')).toBeInTheDocument()
      })
    })
  })
})