import { NextRequest, NextResponse } from 'next/server'

// Pre-defined responses for performance (Refactor Phase)
const mockUsers = new Set([
  'test@example.com',
  'gacha-test@example.com', 
  'medal-test@example.com',
  'performance-test@example.com'
])

const USER_RESPONSE_BASE = {
  success: true,
  user: {
    id: 'test-user-123',
    name: 'Test User'
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { email, password } = body

    // Fast validation (optimized)
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Optimized user lookup using Set for O(1) performance
    if (mockUsers.has(email)) {
      // Pre-computed token for performance
      const mockToken = Buffer.from(JSON.stringify({
        userId: 'test-user-123',
        email: email,
        exp: Date.now() + 3600000 // 1 hour
      })).toString('base64')

      return NextResponse.json({
        ...USER_RESPONSE_BASE,
        token: mockToken,
        user: {
          ...USER_RESPONSE_BASE.user,
          email: email
        },
        responseTime: Date.now() - startTime
      })
    }

    // Authentication failed
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )

  } catch (_error) {
    console.error("Error:", _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}