import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, itemType, itemId } = body

    if (!amount || !itemType || !itemId || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount, item type, and item ID are required' },
        { status: 400 }
      )
    }

    // Mock medal spending for Green Phase
    const currentBalance = Math.floor(Math.random() * 10000) + 5000

    // Check if user has enough medals
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient medal balance' },
        { status: 400 }
      )
    }

    const newBalance = currentBalance - amount

    return NextResponse.json({
      success: true,
      transactionId: `spend-${Date.now()}`,
      spentAmount: amount,
      itemType: itemType,
      itemId: itemId,
      previousBalance: currentBalance,
      newBalance: newBalance,
      timestamp: new Date().toISOString()
    })

  } catch (_error) {
    console.error("Error:", _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}