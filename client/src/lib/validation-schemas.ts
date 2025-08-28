import { z } from 'zod'

// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください')
    .max(254, 'メールアドレスが長すぎます'),
  password: z
    .string()
    .min(1, 'パスワードは必須です'),
  rememberMe: z.boolean().default(false)
})

// Register schema
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください')
    .max(254, 'メールアドレスが長すぎます'),
  displayName: z
    .string()
    .max(50, '表示名は50文字以下である必要があります')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .max(128, 'パスワードが長すぎます'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: '利用規約に同意してください'
  }),
  agreeToPrivacy: z.boolean().refine((val) => val === true, {
    message: 'プライバシーポリシーに同意してください'
  }),
  agreeToMarketing: z.boolean().default(false)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword']
})

// Password reset schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレスを入力してください')
    .max(254, 'メールアドレスが長すぎます')
})

// Export types
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>