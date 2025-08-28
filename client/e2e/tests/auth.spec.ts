import { test } from '../fixtures/auth-setup'
import { testUsers } from '../fixtures/test-data'

test.describe('Authentication Flow Tests', () => {
  test('TC-001: Valid login', async ({ authPage }) => {
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await authPage.expectLoginSuccess()
  })

  test('TC-002: Invalid email login', async ({ authPage }) => {
    await authPage.goto()
    await authPage.login('invalid@example.com', testUsers.normalUser.password)
    await authPage.expectError('メールアドレスまたはパスワードが間違っています')
  })

  test('TC-003: Invalid password login', async ({ authPage }) => {
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, 'wrongpassword')
    await authPage.expectError('メールアドレスまたはパスワードが間違っています')
  })

  test('TC-004: Empty email login', async ({ authPage }) => {
    await authPage.goto()
    await authPage.login('', testUsers.normalUser.password)
    await authPage.expectError('メールアドレスを入力してください')
  })

  test('TC-005: Empty password login', async ({ authPage }) => {
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, '')
    await authPage.expectError('パスワードを入力してください')
  })

  test('TC-006: Valid user registration', async ({ authPage }) => {
    await authPage.gotoRegister()
    await authPage.register('newuser@koepon.com', 'NewPass123!', 'New User')
    await authPage.expectRegisterSuccess()
  })

  test('TC-007: Duplicate email registration', async ({ authPage }) => {
    await authPage.gotoRegister()
    await authPage.register(testUsers.normalUser.email, 'NewPass123!', 'Duplicate User')
    await authPage.expectError('このメールアドレスは既に使用されています')
  })

  test('TC-008: User logout', async ({ authPage }) => {
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await authPage.expectLoginSuccess()
    await authPage.logout()
    await authPage.expectLoggedOut()
  })
})