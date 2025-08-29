import { NextRequest, NextResponse } from 'next/server'
import { ApiClient } from '@/lib/api-client'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  return await ApiClient.proxyRequest(`/admin/gacha/${id}`, request, 'POST')
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params
  return await ApiClient.proxyRequest(`/admin/gacha/${id}`, request, 'DELETE')
}