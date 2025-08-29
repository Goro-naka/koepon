'use client'

import { useState, FormEvent } from 'react'
import { CardElement } from '@stripe/react-stripe-js'
import { useStripePayment, PaymentData } from '@/hooks/useStripePayment'

interface PaymentFormProps {
  gachaId: string
  amount: number
  pullType: 'single' | 'ten'
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export function PaymentForm({ 
  gachaId, 
  amount, 
  pullType, 
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const { loading, error, success, createPaymentIntent, confirmPayment } = useStripePayment()
  const [cardError, setCardError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (loading) return

    try {
      setCardError(null)
      
      // Create Payment Intent
      const clientSecret = await createPaymentIntent({
        gachaId,
        amount,
        pullType
      })

      // Confirm Payment
      const result = await confirmPayment(clientSecret)

      if (result.error) {
        onError(result.error.message || 'Payment failed')
      } else if (result.paymentIntent) {
        onSuccess(result.paymentIntent.id)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      onError(errorMessage)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null)
  }

  return (
    <form data-testid="payment-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
        
        {/* Amount Display */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              {pullType === 'single' ? 'Single Pull' : '10 Pull'} Gacha
            </span>
            <span className="text-xl font-bold">
              ¥{amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card Element */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div 
            data-testid="card-element" 
            className="p-3 border border-gray-300 rounded-md"
          >
            <CardElement 
              options={cardElementOptions}
              onChange={handleCardChange}
            />
          </div>
          
          {/* Card Error */}
          {cardError && (
            <div data-testid="validation-message" className="mt-2 text-sm text-red-600">
              {cardError}
            </div>
          )}
        </div>

        {/* Form Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div 
                data-testid="loading-spinner"
                className="animate-spin rounded-full h-4 w-4 border-2 border-white border-top-transparent mr-2"
              ></div>
              Processing...
            </>
          ) : (
            `Pay ¥${amount.toLocaleString()}`
          )}
        </button>

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">Payment completed successfully!</p>
          </div>
        )}
      </div>
    </form>
  )
}