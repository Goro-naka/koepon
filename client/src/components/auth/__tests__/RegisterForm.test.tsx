import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '../RegisterForm'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the auth store
jest.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    register: jest.fn(),
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

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // RC001: Basic rendering tests
  describe('Basic Rendering', () => {
    it('should render registration form with all required elements', () => {
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('form', { name: /アカウント作成/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ユーザー名/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/表示名/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/パスワード確認/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /アカウント作成/i })).toBeInTheDocument()
    })

    it('should render birth date fields', () => {
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      expect(screen.getByLabelText(/生年月日/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/年/)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/月/)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/日/)).toBeInTheDocument()
    })

    it('should render agreement checkboxes', () => {
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      expect(screen.getByLabelText(/利用規約に同意/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/プライバシーポリシーに同意/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/マーケティング情報の受信に同意/i)).toBeInTheDocument()
    })

    it('should render form title correctly', () => {
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /アカウント作成/i })).toBeInTheDocument()
    })
  })

  // RC002: Form input handling
  describe('Form Input Handling', () => {
    it('should accept all text input fields', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getByLabelText(/ユーザー名/i), 'testuser')
      await user.type(screen.getByLabelText(/表示名/i), 'Test User')
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.type(screen.getByLabelText(/パスワード確認/i), 'password123')
      
      expect(screen.getByLabelText(/メールアドレス/i)).toHaveValue('test@example.com')
      expect(screen.getByLabelText(/ユーザー名/i)).toHaveValue('testuser')
      expect(screen.getByLabelText(/表示名/i)).toHaveValue('Test User')
      expect(screen.getByLabelText(/パスワード/i)).toHaveValue('password123')
      expect(screen.getByLabelText(/パスワード確認/i)).toHaveValue('password123')
    })

    it('should handle birth date selection', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      const yearSelect = screen.getByDisplayValue(/年/)
      const monthSelect = screen.getByDisplayValue(/月/)
      const daySelect = screen.getByDisplayValue(/日/)
      
      await user.selectOptions(yearSelect, '2000')
      await user.selectOptions(monthSelect, '5')
      await user.selectOptions(daySelect, '15')
      
      expect(yearSelect).toHaveValue('2000')
      expect(monthSelect).toHaveValue('5')
      expect(daySelect).toHaveValue('15')
    })

    it('should toggle agreement checkboxes', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      const termsCheckbox = screen.getByLabelText(/利用規約に同意/i)
      const privacyCheckbox = screen.getByLabelText(/プライバシーポリシーに同意/i)
      const marketingCheckbox = screen.getByLabelText(/マーケティング情報の受信に同意/i)
      
      expect(termsCheckbox).not.toBeChecked()
      expect(privacyCheckbox).not.toBeChecked()
      expect(marketingCheckbox).not.toBeChecked()
      
      await user.click(termsCheckbox)
      await user.click(privacyCheckbox)
      await user.click(marketingCheckbox)
      
      expect(termsCheckbox).toBeChecked()
      expect(privacyCheckbox).toBeChecked()
      expect(marketingCheckbox).toBeChecked()
    })
  })

  // RC003: Username validation
  describe('Username Validation', () => {
    it('should show error for username too short', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/ユーザー名/i), 'ab')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/ユーザー名は3文字以上である必要があります/i)).toBeInTheDocument()
      })
    })

    it('should show error for username too long', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/ユーザー名/i), 'a'.repeat(21))
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/ユーザー名は20文字以下である必要があります/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid username format', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/ユーザー名/i), '123user')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/英数字とアンダースコアのみ使用可能です（先頭は英字）/i)).toBeInTheDocument()
      })
    })

    it('should accept valid username', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/ユーザー名/i), 'valid_user123')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.queryByText(/英数字とアンダースコアのみ使用可能です/i)).not.toBeInTheDocument()
      })
    })
  })

  // RC004: Password validation
  describe('Password Validation', () => {
    it('should show error for password too short', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/パスワード/i), '1234567')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードは8文字以上である必要があります/i)).toBeInTheDocument()
      })
    })

    it('should show error for password mismatch', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.type(screen.getByLabelText(/パスワード確認/i), 'password456')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/パスワードが一致しません/i)).toBeInTheDocument()
      })
    })

    it('should show password strength indicator', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.type(screen.getByLabelText(/パスワード/i), 'weak')
      expect(screen.getByText(/弱い/i)).toBeInTheDocument()
      
      await user.clear(screen.getByLabelText(/パスワード/i))
      await user.type(screen.getByLabelText(/パスワード/i), 'StrongPassword123!')
      expect(screen.getByText(/強い/i)).toBeInTheDocument()
    })
  })

  // RC005: Age validation
  describe('Age Validation', () => {
    it('should show error for users under 13', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      const currentYear = new Date().getFullYear()
      const underageYear = currentYear - 10
      
      await user.selectOptions(screen.getByDisplayValue(/年/), underageYear.toString())
      await user.selectOptions(screen.getByDisplayValue(/月/), '1')
      await user.selectOptions(screen.getByDisplayValue(/日/), '1')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/13歳以上である必要があります/i)).toBeInTheDocument()
      })
    })

    it('should accept users 13 and older', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      const currentYear = new Date().getFullYear()
      const validYear = currentYear - 20
      
      await user.selectOptions(screen.getByDisplayValue(/年/), validYear.toString())
      await user.selectOptions(screen.getByDisplayValue(/月/), '1')
      await user.selectOptions(screen.getByDisplayValue(/日/), '1')
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.queryByText(/13歳以上である必要があります/i)).not.toBeInTheDocument()
      })
    })
  })

  // RC006: Agreement validation
  describe('Agreement Validation', () => {
    it('should show error when required agreements are not checked', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/利用規約に同意してください/i)).toBeInTheDocument()
        expect(screen.getByText(/プライバシーポリシーに同意してください/i)).toBeInTheDocument()
      })
    })

    it('should not require marketing agreement', async () => {
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      // Check only required agreements
      await user.click(screen.getByLabelText(/利用規約に同意/i))
      await user.click(screen.getByLabelText(/プライバシーポリシーに同意/i))
      
      // Marketing checkbox should remain unchecked without error
      expect(screen.getByLabelText(/マーケティング情報の受信に同意/i)).not.toBeChecked()
      
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      // Should not show marketing-related error
      await waitFor(() => {
        expect(screen.queryByText(/マーケティング/i)).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  // RC007: Form submission
  describe('Form Submission', () => {
    it('should call register function with correct data on valid submission', async () => {
      const mockRegister = jest.fn()
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: null,
      })
      
      const user = userEvent.setup()
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      // Fill all required fields
      await user.type(screen.getByLabelText(/メールアドレス/i), 'test@example.com')
      await user.type(screen.getByLabelText(/ユーザー名/i), 'testuser')
      await user.type(screen.getByLabelText(/パスワード/i), 'password123')
      await user.type(screen.getByLabelText(/パスワード確認/i), 'password123')
      await user.selectOptions(screen.getByDisplayValue(/年/), '2000')
      await user.selectOptions(screen.getByDisplayValue(/月/), '5')
      await user.selectOptions(screen.getByDisplayValue(/日/), '15')
      await user.click(screen.getByLabelText(/利用規約に同意/i))
      await user.click(screen.getByLabelText(/プライバシーポリシーに同意/i))
      await user.click(screen.getByRole('button', { name: /アカウント作成/i }))
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'test@example.com',
          username: 'testuser',
          displayName: '',
          password: 'password123',
          confirmPassword: 'password123',
          birthDate: { year: 2000, month: 5, day: 15 },
          agreeToTerms: true,
          agreeToPrivacy: true,
          agreeToMarketing: false,
        })
      })
    })

    it('should disable submit button during loading state', async () => {
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        register: jest.fn(),
        isLoading: true,
        error: null,
      })
      
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      const submitButton = screen.getByRole('button', { name: /作成中/i })
      expect(submitButton).toBeDisabled()
    })
  })

  // RC008: Error handling
  describe('Error Handling', () => {
    it('should display registration errors', async () => {
      jest.mocked(require('@/stores/auth').useAuthStore).mockReturnValue({
        register: jest.fn(),
        isLoading: false,
        error: 'このメールアドレスは既に使用されています',
      })
      
      render(<RegisterForm />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/このメールアドレスは既に使用されています/i)).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})