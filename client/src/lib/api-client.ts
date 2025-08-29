import { NextRequest, NextResponse } from 'next/server'

// Backend API base URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3002/api/v1'

export class ApiClient {
  private static baseURL = BACKEND_API_URL

  /**
   * Proxy a request to the backend API
   */
  static async proxyRequest(
    request: NextRequest,
    endpoint: string,
    method?: string
  ): Promise<NextResponse> {
    try {
      // Parse request body if it exists
      let body = undefined
      if (request.body) {
        const text = await request.text()
        body = text ? text : undefined
      }

      // Set up headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Forward auth headers if they exist
      const authHeader = request.headers.get('Authorization')
      if (authHeader) {
        headers['Authorization'] = authHeader
      }

      // Make request to backend
      const backendResponse = await fetch(`${this.baseURL}${endpoint}`, {
        method: method || request.method,
        headers,
        body,
      })

      // Get response data
      const data = await backendResponse.json()

      // Return response with same status code
      return NextResponse.json(data, { 
        status: backendResponse.status,
        headers: {
          'Content-Type': 'application/json',
        }
      })

    } catch (error) {
      console.error(`API proxy error for ${endpoint}:`, error)
      
      // Return error response without fallback to mock data
      return NextResponse.json(
        { error: 'API サーバーに接続できませんでした。しばらくしてから再度お試しください。' },
        { status: 503 }
      )
    }
  }

  /**
   * Make a direct API call to the backend (for server-side usage)
   */
  static async call(
    endpoint: string,
    options: {
      method?: string
      headers?: Record<string, string>
      body?: any
    } = {}
  ) {
    const { method = 'GET', headers = {}, body } = options

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Direct API call error for ${endpoint}:`, error)
      throw error
    }
  }
}