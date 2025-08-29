'use client'

import { useState, useCallback } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { apiClient } from '@/lib/frontend-api-client'

export interface PaymentData {
  gachaId: string
  amount: number
  pullType: 'single' | 'ten'
}

export interface PaymentResult {
  success: boolean
  paymentIntentId: string
  error?: string
}

export interface PaymentState {
  loading: boolean
  error: string | null
  success: boolean
}

export function useStripePayment() {
  const stripe = useStripe()
  const elements = useElements()
  
  const [state, setState] = useState<PaymentState>({
    loading: false,
    error: null,
    success: false
  })

  const createPaymentIntent = useCallback(async (paymentData: PaymentData): Promise<string> => {
    if (state.loading) {
      throw new Error('Payment already in progress')
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await apiClient.post('/payments/create-intent', paymentData)
      
      setState(prev => ({ ...prev, loading: false }))
      
      return response.data.clientSecret
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      throw error
    }
  }, [state.loading])

  const confirmPayment = useCallback(async (clientSecret: string) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not initialized')
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement
        }
      })

      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.error?.message || 'Payment failed',
          success: false
        }))
        return result
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: null,
        success: true
      }))

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment confirmation failed'
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
        success: false
      }))
      throw error
    }
  }, [stripe, elements])

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      success: false
    })
  }, [])

  return {
    ...state,
    createPaymentIntent,
    confirmPayment,
    reset
  }
}