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
    const { gachaId, drawCount = 10, useTicket = false } = body

    if (!gachaId || drawCount < 1 || drawCount > 20) {
      return NextResponse.json(
        { error: 'Invalid gacha parameters' },
        { status: 400 }
      )
    }

    // Mock items for multi-draw
    const mockItems = [
      { id: 'item-1', name: 'Common Voice Pack', rarity: 'Common' },
      { id: 'item-2', name: 'Rare Voice Pack', rarity: 'Rare' },
      { id: 'item-3', name: 'Epic Voice Pack', rarity: 'Epic' },
      { id: 'item-4', name: 'Legendary Voice Pack', rarity: 'Legendary' },
      { id: 'item-5', name: 'Special Voice Pack', rarity: 'Special' }
    ]

    // Simulate longer processing time for multi-draw
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))

    const results = []
    for (let i = 0; i < drawCount; i++) {
      const randomItem = mockItems[Math.floor(Math.random() * mockItems.length)]
      results.push({
        ...randomItem,
        drawId: `multi-draw-${Date.now()}-${i}`,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      gachaId,
      drawCount,
      results: results,
      medalCost: drawCount * 300,
      newMedalBalance: Math.floor(Math.random() * 10000) + 5000,
      bonusItems: drawCount >= 10 ? [{ id: 'bonus-1', name: 'Bonus Voice Pack' }] : []
    })

  } catch (_error) {
    console.error("Error:", _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}