export interface StripePaymentData {
  amount: number
  currency: 'jpy'
  description: string
  metadata: {
    gachaId: string
    count: number
    userId: string
  }
}

export interface StripePaymentResult {
  success: boolean
  id?: string
  error?: string
}

export async function processStripePayment(data: StripePaymentData): Promise<StripePaymentResult> {
  // TODO: 実際のStripe決済処理を実装
  console.log('Processing Stripe payment:', data)
  
  // モック実装
  return {
    success: true,
    id: `pi_mock_${Date.now()}`
  }
}