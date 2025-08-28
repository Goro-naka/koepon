import { z } from 'zod'
import DOMPurify from 'dompurify'

// Password security validation
export const securePasswordSchema = z.string()
  .min(8, 'パスワードは8文字以上である必要があります')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'パスワードは英小文字、英大文字、数字、記号を含む必要があります')
  .refine((password) => {
    // Check against common weak passwords
    const weakPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      'admin', 'user', 'guest', '12345678', 'welcome'
    ]
    return !weakPasswords.includes(password.toLowerCase())
  }, 'よく使われるパスワードは使用できません')

// Email security validation  
export const secureEmailSchema = z.string()
  .email('正しいメールアドレスを入力してください')
  .max(254, 'メールアドレスが長すぎます')
  .refine((email) => {
    // Additional email security checks
    const suspiciousPatterns = [
      /\.{2,}/, // Multiple consecutive dots
      /^\./, // Starts with dot
      /\.$/, // Ends with dot
      /@\./, // @ followed by dot
      /\.@/, // Dot followed by @
    ]
    return !suspiciousPatterns.some(pattern => pattern.test(email))
  }, '無効なメールアドレス形式です')

// Input sanitization utilities
export class InputSanitizer {
  // XSS protection
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: []
    })
  }

  // SQL injection prevention (for display purposes)
  static sanitizeSQL(input: string): string {
    // Remove SQL keywords and special characters
    return input.replace(/[';\\x00\\n\\r\\\\\"\\x1a]/g, '')
                .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND|WHERE|FROM|JOIN)\b/gi, '')
  }

  // Path traversal prevention
  static sanitizePath(path: string): string {
    // Remove directory traversal attempts
    return path.replace(/\.\./g, '')
               .replace(/[\/\\]/g, '')
               .replace(/\0/g, '') // Null byte injection
  }

  // Command injection prevention
  static sanitizeCommand(input: string): string {
    // Remove shell metacharacters
    return input.replace(/[|&;$`\\r\\n<>]/g, '')
  }

  // General input sanitization
  static sanitizeGeneral(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') {
      return ''
    }
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
  }
}

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string()
    .max(255, 'ファイル名が長すぎます')
    .regex(/^[a-zA-Z0-9._-]+$/, '無効なファイル名です'),
  
  size: z.number()
    .max(10 * 1024 * 1024, 'ファイルサイズは10MB以下にしてください'),
    
  mimetype: z.enum([
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav'
  ], { errorMap: () => ({ message: 'サポートされていないファイル形式です' }) })
})

// Rate limiting helpers
export class RateLimiter {
  private static attempts = new Map<string, { count: number; firstAttempt: number }>()
  
  static checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const userAttempts = this.attempts.get(identifier)
    
    if (!userAttempts || now - userAttempts.firstAttempt > windowMs) {
      // Reset counter for new window
      this.attempts.set(identifier, { count: 1, firstAttempt: now })
      return true
    }
    
    if (userAttempts.count >= maxAttempts) {
      return false // Rate limit exceeded
    }
    
    // Increment counter
    userAttempts.count++
    return true
  }
  
  static getRemainingAttempts(identifier: string, maxAttempts = 5): number {
    const userAttempts = this.attempts.get(identifier)
    if (!userAttempts) return maxAttempts
    
    return Math.max(0, maxAttempts - userAttempts.count)
  }
  
  static getResetTime(identifier: string, windowMs = 15 * 60 * 1000): number {
    const userAttempts = this.attempts.get(identifier)
    if (!userAttempts) return 0
    
    return userAttempts.firstAttempt + windowMs
  }
}

// Security validation schemas
export const securityValidationSchemas = {
  userRegistration: z.object({
    email: secureEmailSchema,
    password: securePasswordSchema,
    displayName: z.string()
      .min(1, '表示名を入力してください')
      .max(50, '表示名は50文字以下にしてください')
      .regex(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+$/, '無効な文字が含まれています')
  }),
  
  gachaSearch: z.object({
    query: z.string()
      .max(100, '検索クエリが長すぎます')
      .transform(InputSanitizer.sanitizeHTML)
  }),
  
  profileUpdate: z.object({
    bio: z.string()
      .max(500, '自己紹介文は500文字以内で入力してください')
      .transform(InputSanitizer.sanitizeHTML),
    phone: z.string()
      .regex(/^[\d-+().\s]{10,15}$/, '正しい電話番号を入力してください')
      .optional()
  }),
  
  medalPurchase: z.object({
    quantity: z.number()
      .int('購入数量は整数を入力してください')
      .min(1, '購入数量は1以上を入力してください')
      .max(10000, '一度に購入できるメダル数は10000枚までです')
  })
}