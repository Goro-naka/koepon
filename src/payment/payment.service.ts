import Stripe from 'stripe'
import { Injectable } from '@nestjs/common'

export interface PaymentIntentData {
  amount: number
  currency: 'jpy'
  metadata: {
    userId: string
    gachaId: string
    drawCount: number
  }
}

@Injectable()
export class PaymentService {
  private stripe: Stripe

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20'
    })
  }

  async createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    const description = data.metadata.drawCount === 1 
      ? `ガチャ単発抽選` 
      : `ガチャ10連抽選`

    return await this.stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      metadata: {
        userId: data.metadata.userId,
        gachaId: data.metadata.gachaId,
        drawCount: data.metadata.drawCount.toString()
      },
      description,
      automatic_payment_methods: {
        enabled: true
      }
    })
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent.status === 'succeeded'
    } catch (error) {
      return false
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          // 決済成功時の処理
          console.log('Payment succeeded:', event.data.object.id)
          break
        case 'payment_intent.payment_failed':
          // 決済失敗時の処理
          console.log('Payment failed:', event.data.object.id)
          break
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      throw new Error(`Webhook error: ${error.message}`)
    }
  }
}