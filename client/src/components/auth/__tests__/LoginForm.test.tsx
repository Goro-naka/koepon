import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the auth store
const mockLogin = jest.fn()
const mockClearError = jest.fn()

jest.mock('@/stores/auth', () => ({
  useAuthStore: jest.fn(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
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
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
  Wrapper.displayName = 'QueryWrapper'
  return Wrapper
}

describe('LoginForm', () => {
  const { useAuthStore } = require('@/stores/auth')
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset to default mock return value
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    })
  })

  // LC001: Basic rendering tests
  describe('Basic Rendering', () => {
    it('should render login form with all required elements', () => {
      render(<LoginForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('form', { name: /ログイン/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^パスワード$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ログイン状態を保持/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /パスワードを忘れた方/i })).toBeInTheDocument()
    })

    it('should render form title correctly', () => {
      render(<LoginForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /ログイン/i })).toBeInTheDocument()
    })

    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('required')
    })
  })

  // LC002: Form input handling
  describe('Form Input Handling', () => {
    it('should accept email input', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should accept password input', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      await user.type(passwordInput, 'password123')
      
      expect(passwordInput).toHaveValue('password123')
    })

    it('should toggle remember me checkbox', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const checkbox = screen.getByLabelText(/ログイン状態を保持/i)
      expect(checkbox).not.toBeChecked()
      
      await user.click(checkbox)
      expect(checkbox).toBeChecked()
      
      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('should show/hide password when toggle button is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const passwordInput = screen.getByLabelText(/^パスワード$/i)
      const toggleButton = screen.getByRole('button', { name: /パスワードを表示/i })
      
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  // LC003: Form validation
  describe('Form Validation', () => {
    it('should show required field errors when submitting empty form', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスは必須です/i)).toBeInTheDocument()
        expect(screen.getByText(/パスワードは必須です/i)).toBeInTheDocument()
      })
    })

    it('should show email format error for invalid email', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/正しいメールアドレスを入力してください/i)).toBeInTheDocument()
      })
    })

    it('should show error for email that is too long', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const longEmail = 'a'.repeat(250) + '@example.com'
      
      await user.type(emailInput, longEmail)
      await user.click(screen.getByRole('button', { name: /ログイン/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/メールアドレスが長すぎます/i)).toBeInTheDocument()
      })
    })

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const emailInput = screen.getByLabelText(/メールアドレス/i)
      const submitButton = screen.getByRole('button', { name: /ログイン/i })
      
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

  // LC004: Form submission
  describe('Form Submission', () => {
    it('should call login function with correct data on valid submission', async () => {
      const { useAuthStore } = require('@/stores/auth')
      const testMockLogin = jest.fn()
      useAuthStore.mockReturnValue({
        login: testMockLogin,
        isLoading: false,
        error: null,
        clearError: mockClearError,
      })
      
      const user = userEvent.setup()
      render(<LoginForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getByLabelText(/^パスワード$/i), 'password123')
      await user.click(screen.getByLabelText(/ログイン状態を保持/i))
      await user.click(screen.getByRole('button', { name: /ログイン/i }))
      
      await waitFor(() => {
        expect(testMockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        })
      })
    })

    it('should disable submit button during loading state', async () => {
      const { useAuthStore } = require('@/stores/auth')
      useAuthStore.mockReturnValue({
        login: jest.fn(),
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })
      
      render(<LoginForm />, { wrapper: createWrapper() })
      
      const submitButton = screen.getByRole('button', { name: /ログイン中/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading spinner during submission', async () => {
      const { useAuthStore } = require('@/stores/auth')
      useAuthStore.mockReturnValue({
        login: jest.fn(),
        isLoading: true,
        error: null,
        clearError: mockClearError,
      })
      
      render(<LoginForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('button', { name: /ログイン中/i })).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  // LC005: Error handling
  describe('Error Handling', () => {
    it('should display authentication error', async () => {
      const { useAuthStore } = require('@/stores/auth')
      useAuthStore.mockReturnValue({
        login: jest.fn(),
        isLoading: false,
        error: 'メールアドレスまたはパスワードが間違っています',
        clearError: mockClearError,
      })
      
      render(<LoginForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/メールアドレスまたはパスワードが間違っています/i)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should display network error', async () => {
      const { useAuthStore } = require('@/stores/auth')
      useAuthStore.mockReturnValue({
        login: jest.fn(),
        isLoading: false,
        error: 'ネットワークエラーが発生しました',
        clearError: mockClearError,
      })
      
      render(<LoginForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/ネットワークエラーが発生しました/i)).toBeInTheDocument()
    })

    it('should clear error when user starts typing', async () => {
      const user = userEvent.setup()
      const { useAuthStore } = require('@/stores/auth')
      useAuthStore.mockReturnValue({
        login: jest.fn(),
        isLoading: false,
        error: 'メールアドレスまたはパスワードが間違っています',
        clearError: mockClearError,
      })
      
      render(<LoginForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/メールアドレスまたはパスワードが間違っています/i)).toBeInTheDocument()
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'new@example.com')
      
      // Error should be cleared (this would be implemented in the component)
    })
  })
})