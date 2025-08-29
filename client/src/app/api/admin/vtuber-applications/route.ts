import { NextRequest, NextResponse } from 'next/server'
import { ApiClient } from '@/lib/api-client'

export async function GET(request: NextRequest) {
  return await ApiClient.proxyRequest('/admin/vtubers', request)
}