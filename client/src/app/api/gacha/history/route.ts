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

    // Mock gacha history for Green Phase
    const mockHistory = []
    const gachaTypes = ['basic-gacha-001', 'premium-gacha-002', 'special-gacha-003']
    const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Special']

    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      const gachaId = gachaTypes[Math.floor(Math.random() * gachaTypes.length)]
      const rarity = rarities[Math.floor(Math.random() * rarities.length)]
      
      mockHistory.push({
        id: `history-${Date.now()}-${i}`,
        gachaId: gachaId,
        gachaName: `${gachaId.includes('basic') ? 'Basic' : gachaId.includes('premium') ? 'Premium' : 'Special'} Voice Pack Gacha`,
        result: {
          id: `item-${i}`,
          name: `${rarity} Voice Pack`,
          rarity: rarity
        },
        medalCost: gachaId.includes('basic') ? 100 : gachaId.includes('premium') ? 300 : 500,
        timestamp: timestamp.toISOString(),
        drawType: Math.random() > 0.7 ? 'multi' : 'single'
      })
    }

    return NextResponse.json({
      success: true,
      history: mockHistory,
      totalCount: 150, // Mock total count
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < 150
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