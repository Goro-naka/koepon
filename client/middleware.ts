import { NextRequest } from 'next/server'
import { securityMiddleware } from './src/middleware/security'

export function middleware(request: NextRequest) {
  return securityMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}