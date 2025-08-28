import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// JWT Security Configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  algorithm: 'HS256' as const,
  expiresIn: '1h', // 1 hour access token
  refreshExpiresIn: '7d', // 7 day refresh token
  issuer: 'koepon-app',
  audience: 'koepon-users'
}

// Password Security Functions
export class PasswordSecurity {
  private static readonly SALT_ROUNDS = 12
  
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }
  
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
  
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
  
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64url')
  }
}

// JWT Token Management
export class TokenManager {
  static generateAccessToken(payload: {
    userId: string
    email: string
    role: string
  }): string {
    return jwt.sign(
      {
        sub: payload.userId,
        email: payload.email,
        role: payload.role,
        type: 'access'
      },
      jwtConfig.secret,
      {
        algorithm: jwtConfig.algorithm,
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }
    )
  }
  
  static generateRefreshToken(userId: string): string {
    return jwt.sign(
      {
        sub: userId,
        type: 'refresh'
      },
      jwtConfig.secret,
      {
        algorithm: jwtConfig.algorithm,
        expiresIn: jwtConfig.refreshExpiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      }
    )
  }
  
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, jwtConfig.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      })
    } catch (_error) {
      throw new Error('Invalid or expired token')
    }
  }
  
  static isTokenExpired(token: string): boolean {
    try {
      jwt.verify(token, jwtConfig.secret)
      return false
    } catch (_error) {
      return error instanceof jwt.TokenExpiredError
    }
  }
}

// Session Security Management
export class SessionSecurity {
  private static activeSessions = new Map<string, {
    userId: string
    createdAt: number
    lastActivity: number
    userAgent: string
    ipAddress: string
  }>()
  
  private static readonly MAX_SESSIONS_PER_USER = 5
  private static readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private static readonly ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours
  
  static createSession(sessionId: string, userId: string, userAgent: string, ipAddress: string): void {
    const now = Date.now()
    
    // Remove old sessions for the same user if limit exceeded
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.userId === userId)
      .sort((a, b) => a[1].lastActivity - b[1].lastActivity)
    
    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      this.activeSessions.delete(userSessions[0][0])
    }
    
    this.activeSessions.set(sessionId, {
      userId,
      createdAt: now,
      lastActivity: now,
      userAgent,
      ipAddress
    })
  }
  
  static validateSession(sessionId: string, userAgent: string, ipAddress: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      return false
    }
    
    const now = Date.now()
    
    // Check inactivity timeout
    if (now - session.lastActivity > this.INACTIVITY_TIMEOUT) {
      this.activeSessions.delete(sessionId)
      return false
    }
    
    // Check absolute timeout
    if (now - session.createdAt > this.ABSOLUTE_TIMEOUT) {
      this.activeSessions.delete(sessionId)
      return false
    }
    
    // Check for session hijacking (basic check)
    if (session.userAgent !== userAgent || session.ipAddress !== ipAddress) {
      this.activeSessions.delete(sessionId)
      return false
    }
    
    // Update last activity
    session.lastActivity = now
    return true
  }
  
  static destroySession(sessionId: string): void {
    this.activeSessions.delete(sessionId)
  }
  
  static cleanupExpiredSessions(): void {
    const now = Date.now()
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity > this.INACTIVITY_TIMEOUT ||
          now - session.createdAt > this.ABSOLUTE_TIMEOUT) {
        this.activeSessions.delete(sessionId)
      }
    }
  }
}

// Brute Force Protection
export class BruteForceProtection {
  private static attempts = new Map<string, {
    count: number
    lastAttempt: number
    lockedUntil?: number
  }>()
  
  private static readonly MAX_ATTEMPTS = 5
  private static readonly LOCK_DURATION = 15 * 60 * 1000 // 15 minutes
  private static readonly ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes
  
  static recordFailedAttempt(identifier: string): void {
    const now = Date.now()
    const record = this.attempts.get(identifier)
    
    if (!record || now - record.lastAttempt > this.ATTEMPT_WINDOW) {
      // Reset counter for new window
      this.attempts.set(identifier, {
        count: 1,
        lastAttempt: now
      })
      return
    }
    
    record.count++
    record.lastAttempt = now
    
    if (record.count >= this.MAX_ATTEMPTS) {
      record.lockedUntil = now + this.LOCK_DURATION
    }
  }
  
  static isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier)
    if (!record || !record.lockedUntil) {
      return false
    }
    
    if (Date.now() > record.lockedUntil) {
      // Lock expired, reset
      this.attempts.delete(identifier)
      return false
    }
    
    return true
  }
  
  static getRemainingLockTime(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record || !record.lockedUntil) {
      return 0
    }
    
    return Math.max(0, record.lockedUntil - Date.now())
  }
  
  static clearAttempts(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Security Logging
export class SecurityLogger {
  static logSecurityEvent(event: {
    type: 'login_failed' | 'privilege_escalation_attempt' | 'brute_force_attempt' | 'suspicious_activity'
    userId?: string
    email?: string
    ipAddress: string
    userAgent: string
    details?: Record<string, any>
    severity: 'low' | 'medium' | 'high' | 'critical'
  }): void {
    // In real implementation, this would send to a secure logging service
    const logEntry = {
      ...event,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    }
    
    // Remove sensitive information before logging
    if (logEntry.details) {
      delete logEntry.details.password
      delete logEntry.details.token
      delete logEntry.details.sessionId
    }
    
    console.log('[SECURITY]', JSON.stringify(logEntry))
    
    // In production, would send to:
    // - SIEM system
    // - Security monitoring service
    // - Alert notification system
  }
  
  static logAuthentication(success: boolean, email: string, ipAddress: string, userAgent: string): void {
    if (!success) {
      this.logSecurityEvent({
        type: 'login_failed',
        email: email,
        ipAddress,
        userAgent,
        severity: 'medium'
      })
    }
  }
  
  static logPrivilegeEscalation(userId: string, attemptedResource: string, ipAddress: string, userAgent: string): void {
    this.logSecurityEvent({
      type: 'privilege_escalation_attempt',
      userId,
      ipAddress,
      userAgent,
      details: { attemptedResource },
      severity: 'high'
    })
  }
}

// Encryption utilities
export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32)
  
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag?.()?.toString('hex') || ''
    }
  }
  
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, this.KEY)
    
    if (encryptedData.tag) {
      decipher.setAuthTag?.(Buffer.from(encryptedData.tag, 'hex'))
    }
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}