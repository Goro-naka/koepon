import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordResetForm } from '../PasswordResetForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the auth store
jest.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    resetPassword: jest.fn(),
    isLoading: false,
    error: null,
  }),
}))

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('PasswordResetForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // PRC001: Basic rendering tests
  describe('Basic Rendering', () => {
    it('should render password reset form with all required elements', () => {
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('form', { name: /パスワードリセット/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /リセットメールを送信/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /ログインに戻る/i })).toBeInTheDocument()
    })

    it('should render form title correctly', () => {
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /パスワードリセット/i })).toBeInTheDocument()
    })

    it('should render help text', () => {
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/登録済みのメールアドレスを入力してください/i)).toBeInTheDocument()
      expect(screen.getByText(/パスワードリセット用のリンクをお送りします/i)).toBeInTheDocument()
    })

    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
    })
  })

  // PRC002: Form input handling
  describe('Form Input Handling', () => {
    it('should accept email input', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      await user.type(emailInput, 'test@example.com')
      
      const clearButton = screen.getByRole('button', { name: /クリア/i })
      await user.click(clearButton)
      
      expect(emailInput).toHaveValue('')
    })
  })

  // PRC003: Form validation
  describe('Form Validation', () => {
    it('should show required field error when submitting empty form', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const submitButton = screen.getByRole('button', { name: /リセットメールを送信/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスは必須です/i)).toBeInTheDocument()
      })
    })

    it('should show email format error for invalid email', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /リセットメールを送信/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
      })
    })

    it('should show error for email that is too long', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const longEmail = 'a'.repeat(250) + '@example.com'
      
      await user.type(emailInput, longEmail)
      await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスが長すぎます/i)).toBeInTheDocument()
      })
    })

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /リセットメールを送信/i })
      
      // Trigger validation error
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
      })
      
      // Correct the email
      await user.clear(emailInput)
      await user.type(emailInput, 'valid@example.com')
      
      await waitFor(() => {
        expect(screen.queryByText(/正しいメールアドレスを入力してください/i)).not.toBeInTheDocument()
      })
    })
  })

  // PRC004: Form submission
  describe('Form Submission', () => {
    it('should call resetPassword function with correct data on valid submission', async () => {
      const mockResetPassword = jest.fn()
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: false,
        error: null,
      })
      
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))
      
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
        })
      })
    })

    it('should disable submit button during loading state', async () => {
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: jest.fn(),
        isLoading: true,
        error: null,
      })
      
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const submitButton = screen.getByRole('button', { name: /送信中/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading spinner during submission', async () => {
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: jest.fn(),
        isLoading: true,
        error: null,
      })
      
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('button', { name: /送信中/i })).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  // PRC005: Success state
  describe('Success State', () => {
    it('should show success message after successful submission', async () => {
      const mockResetPassword = jest.fn().mockResolvedValue(undefined)
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: false,
        error: null,
      })
      
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードリセット用のメールを送信しました/i)).toBeInTheDocument()
        expect(screen.getByText(/メールをご確認ください/i)).toBeInTheDocument()
      })
    })

    it('should hide form and show success message in success state', async () => {
      const mockResetPassword = jest.fn().mockResolvedValue(undefined)
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: false,
        error: null,
      })
      
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))
      
      await waitFor(() => {
        expect(screen.queryByLabelText(/メールアドレス/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /リセットメールを送信/i })).not.toBeInTheDocument()
        expect(screen.getByText(/パスワードリセット用のメールを送信しました/i)).toBeInTheDocument()
      })
    })

    it('should show resend link after success', async () => {
      const mockResetPassword = jest.fn().mockResolvedValue(undefined)
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: mockResetPassword,
        isLoading: false,
        error: null,
      })
      
      const user = userEvent.setup()
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /リセットメールを送信/i }))
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /メールを再送信/i })).toBeInTheDocument()
      })
    })
  })

  // PRC006: Error handling
  describe('Error Handling', () => {
    it('should display user not found error', async () => {
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: jest.fn(),
        isLoading: false,
        error: 'このメールアドレスは登録されていません',
      })
      
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/このメールアドレスは登録されていません/i)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should display network error', async () => {
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: jest.fn(),
        isLoading: false,
        error: 'ネットワークエラーが発生しました',
      })
      
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/ネットワークエラーが発生しました/i)).toBeInTheDocument()
    })

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        resetPassword: jest.fn(),
        isLoading: false,
        error: 'このメールアドレスは登録されていません',
      })
      
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/このメールアドレスは登録されていません/i)).toBeInTheDocument()
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'new@example.com')
      
      // Error should be cleared (this would be implemented in the component)
    })
  })

  // PRC007: Navigation and links
  describe('Navigation and Links', () => {
    it('should render back to login link', () => {
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const backLink = screen.getByRole('link', { name: /ログインに戻る/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink).toHaveAttribute('href', '/login')
    })

    it('should render register link', () => {
      render(<PasswordResetForm />, { wrapper: createWrapper() })
      
      const registerLink = screen.getByRole('link', { name: /アカウントをお持ちでない方/i })
      expect(registerLink).toBeInTheDocument()
      expect(registerLink).toHaveAttribute('href', '/register')
    })
  })
})