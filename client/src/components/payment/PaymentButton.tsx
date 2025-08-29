'use client'

import { useState } from 'react'
import { PaymentForm } from './PaymentForm'
import { StripeProvider } from './StripeProvider'

interface PaymentButtonProps {
  gachaId: string
  amount: number
  pullType: 'single' | 'ten'
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

export function PaymentButton({ 
  gachaId, 
  amount, 
  pullType, 
  onPaymentSuccess, 
  onPaymentError 
}: PaymentButtonProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  if (!showPaymentForm) {
    return (
      <button
        onClick={() => setShowPaymentForm(true)}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors"
      >
        Purchase {pullType === 'single' ? 'Single' : '10-Pull'} - ¥{amount.toLocaleString()}
      </button>
    )
  }

  return (
    <StripeProvider>
      <PaymentForm
        gachaId={gachaId}
        amount={amount}
        pullType={pullType}
        onSuccess={(paymentIntentId) => {
          setShowPaymentForm(false)
          onPaymentSuccess(paymentIntentId)
        }}
        onError={(error) => {
          setShowPaymentForm(false)
          onPaymentError(error)
        }}
      />
      <button
        onClick={() => setShowPaymentForm(false)}
        className="mt-2 text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </StripeProvider>
  )
}