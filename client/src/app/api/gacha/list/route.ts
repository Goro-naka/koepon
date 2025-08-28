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

    // Mock gacha list for Green Phase
    const mockGachas = [
      {
        id: 'basic-gacha-001',
        name: 'Basic Voice Pack Gacha',
        description: 'Common voice packs with a chance for rare items',
        cost: 100,
        currency: 'medals',
        available: true,
        bannerImage: '/images/gacha/basic-banner.jpg',
        items: [
          { name: 'Common Voice Pack', rarity: 'Common', rate: '70%' },
          { name: 'Rare Voice Pack', rarity: 'Rare', rate: '25%' },
          { name: 'Epic Voice Pack', rarity: 'Epic', rate: '5%' }
        ]
      },
      {
        id: 'premium-gacha-002',
        name: 'Premium Voice Pack Gacha',
        description: 'Higher chance for rare and epic items',
        cost: 300,
        currency: 'medals',
        available: true,
        bannerImage: '/images/gacha/premium-banner.jpg',
        items: [
          { name: 'Rare Voice Pack', rarity: 'Rare', rate: '50%' },
          { name: 'Epic Voice Pack', rarity: 'Epic', rate: '30%' },
          { name: 'Legendary Voice Pack', rarity: 'Legendary', rate: '20%' }
        ]
      },
      {
        id: 'special-gacha-003',
        name: 'Special Event Gacha',
        description: 'Limited time gacha with exclusive items',
        cost: 500,
        currency: 'medals',
        available: true,
        bannerImage: '/images/gacha/special-banner.jpg',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { name: 'Special Voice Pack', rarity: 'Special', rate: '40%' },
          { name: 'Legendary Voice Pack', rarity: 'Legendary', rate: '35%' },
          { name: 'Ultra Rare Voice Pack', rarity: 'Ultra Rare', rate: '25%' }
        ]
      }
    ]

    return NextResponse.json({
      success: true,
      gachas: mockGachas,
      totalCount: mockGachas.length
    })

  } catch (_error) {
    console.error("Error:", _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}