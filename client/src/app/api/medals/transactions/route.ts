import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock transaction history for Green Phase
    const mockTransactions = []
    const transactionTypes = ['gacha-draw', 'medal-purchase', 'reward-claim', 'vtuber-support']

    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
      const isCredit = type === 'medal-purchase' || type === 'reward-claim'
      const amount = isCredit 
        ? Math.floor(Math.random() * 5000) + 1000 
        : -(Math.floor(Math.random() * 500) + 100)
      
      mockTransactions.push({
        id: `tx-${Date.now()}-${i}`,
        type: type,
        amount: amount,
        description: getTransactionDescription(type, Math.abs(amount)),
        timestamp: timestamp.toISOString(),
        balanceAfter: Math.floor(Math.random() * 15000) + 5000
      })
    }

    return NextResponse.json({
      success: true,
      transactions: mockTransactions,
      totalCount: 200, // Mock total count
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < 200
      }
    })

  } catch (_error) {
    console.error("Error:", _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTransactionDescription(type: string, amount: number): string {
  switch (type) {
    case 'gacha-draw':
      return `Gacha draw (${amount} medals)`
    case 'medal-purchase':
      return `Medal purchase (+${amount} medals)`
    case 'reward-claim':
      return `Daily reward (+${amount} medals)`
    case 'vtuber-support':
      return `VTuber support (${amount} medals)`
    default:
      return `Transaction (${amount} medals)`
  }
}