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
    const { gachaId, drawCount = 1, useTicket = false } = body

    if (!gachaId) {
      return NextResponse.json(
        { error: 'GachaId is required' },
        { status: 400 }
      )
    }

    // Mock gacha draw for Green Phase
    const mockItems = [
      { id: 'item-1', name: 'Common Voice Pack', rarity: 'Common' },
      { id: 'item-2', name: 'Rare Voice Pack', rarity: 'Rare' },
      { id: 'item-3', name: 'Epic Voice Pack', rarity: 'Epic' },
      { id: 'item-4', name: 'Legendary Voice Pack', rarity: 'Legendary' }
    ]

    // Simulate processing time for gacha animation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    const results = []
    for (let i = 0; i < drawCount; i++) {
      const randomItem = mockItems[Math.floor(Math.random() * mockItems.length)]
      results.push({
        ...randomItem,
        drawId: `draw-${Date.now()}-${i}`,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      gachaId,
      drawCount,
      result: drawCount === 1 ? results[0] : results,
      items: results,
      medalCost: drawCount * 300,
      newMedalBalance: Math.floor(Math.random() * 10000) + 5000
    })

  } catch (_error) {
    console.error("Error:", _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}