import { NextRequest, NextResponse } from 'next/server'
import { 
  mockDashboardData, 
  mockUsersData, 
  mockVTuberApplicationsData, 
  mockSystemStatusData,
  mockGachaData 
} from './mock-api-data'

// Backend API base URL
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3002/api/v1'
const USE_MOCK_DATA = process.env.NODE_ENV === 'production' || !process.env.BACKEND_API_URL

export class ApiClient {
  private static baseURL = BACKEND_API_URL

  /**
   * Proxy a request to the backend API
   */
  static async proxyRequest(
    endpoint: string,
    request: NextRequest,
    method?: string
  ): Promise<NextResponse> {
    // Use mock data in production when backend API is not available
    if (USE_MOCK_DATA) {
      return this.getMockResponse(endpoint, method || request.method)
    }

    try {
      // Extract headers from the incoming request
      const headers: Record<string, string> = {}
      request.headers.forEach((value, key) => {
        // Forward relevant headers to backend
        if (['authorization', 'content-type', 'user-agent'].includes(key.toLowerCase())) {
          headers[key] = value
        }
      })

      // Get request body if it exists
      let body: string | undefined
      if (method && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        try {
          body = await request.text()
        } catch {
          // Body might be empty or not readable
        }
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
      
      // Fallback to mock data if backend is unavailable
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.log(`Falling back to mock data for ${endpoint}`)
        return this.getMockResponse(endpoint, method || request.method)
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  private static getMockResponse(endpoint: string, method?: string): NextResponse {
    // Handle CRUD operations for gacha endpoints
    if (endpoint.startsWith('/admin/gacha')) {
      if (endpoint === '/admin/gacha' && method === 'GET') {
        return NextResponse.json(mockGachaData)
      }
      if (endpoint === '/admin/gacha' && method === 'POST') {
        const newGacha = {
          id: String(Date.now()),
          title: '新規ガチャ',
          vtuberName: '未選択',
          description: 'ガチャの説明',
          status: 'draft',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          totalDraws: 0,
          revenue: 0,
          items: 0
        }
        return NextResponse.json({
          success: true,
          message: 'Gacha created successfully',
          data: newGacha
        })
      }
      // Handle individual gacha operations
      if (endpoint.includes('/admin/gacha/') && method === 'POST') {
        return NextResponse.json({
          success: true,
          message: 'Gacha updated successfully',
          data: { updated: true }
        })
      }
      if (endpoint.includes('/admin/gacha/') && method === 'DELETE') {
        return NextResponse.json({
          success: true,
          message: 'Gacha deleted successfully',
          deletedId: endpoint.split('/').pop()
        })
      }
    }

    // Handle CRUD operations for VTuber endpoints
    if (endpoint.startsWith('/admin/vtubers') && !endpoint.includes('vtuber-applications')) {
      if (endpoint === '/admin/vtubers' && method === 'POST') {
        const newVTuber = {
          id: String(Date.now()),
          applicant: {
            id: `app${Date.now()}`,
            channelName: '新規VTuber',
            email: 'new@example.com',
            applicationDate: new Date().toISOString()
          },
          status: 'pending',
          priority: 'medium',
          reviewHistory: [],
          estimatedReviewTime: '5-7日'
        }
        return NextResponse.json({
          success: true,
          message: 'VTuber application created successfully',
          data: newVTuber
        })
      }
      if (endpoint.includes('/admin/vtubers/') && method === 'POST') {
        return NextResponse.json({
          success: true,
          message: 'VTuber application updated successfully',
          data: { updated: true }
        })
      }
      if (endpoint.includes('/admin/vtubers/') && method === 'DELETE') {
        return NextResponse.json({
          success: true,
          message: 'VTuber application deleted successfully',
          deletedId: endpoint.split('/').pop()
        })
      }
    }

    switch (endpoint) {
      case '/admin/dashboard/stats':
        return NextResponse.json(mockDashboardData)
      case '/admin/users':
        return NextResponse.json(mockUsersData)
      case '/admin/vtuber-applications':
      case '/admin/vtubers':
        return NextResponse.json(mockVTuberApplicationsData)
      case '/admin/system/monitoring':
        return NextResponse.json(mockSystemStatusData)
      case '/admin/gacha':
        return NextResponse.json(mockGachaData)
      default:
        return NextResponse.json({ error: 'Mock endpoint not found' }, { status: 404 })
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