import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { gachaId, amount, pullType } = await request.json()

    // Validate required fields
    if (!gachaId || !amount || !pullType) {
      return NextResponse.json(
        { error: 'Missing required fields: gachaId, amount, pullType' },
        { status: 400 }
      )
    }

    // Validate amount (100 or 1000 yen)
    if (![100, 1000].includes(amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be 100 or 1000' },
        { status: 400 }
      )
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in JPY (no conversion needed)
      currency: 'jpy',
      description: `Gacha ${pullType} pull`,
      metadata: {
        gachaId,
        pullType,
        // TODO: Add userId from JWT token
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('Payment Intent creation error:', error)
    
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}