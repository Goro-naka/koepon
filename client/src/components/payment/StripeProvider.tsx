'use client'

import { ReactNode, useEffect, useState } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

interface StripeProviderProps {
  children: ReactNode
}

interface StripeState {
  stripe: Stripe | null
  loading: boolean
  error: string | null
}

export function StripeProvider({ children }: StripeProviderProps) {
  const [state, setState] = useState<StripeState>({
    stripe: null,
    loading: true,
    error: null
  })

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  useEffect(() => {
    if (!publishableKey) {
      setState({
        stripe: null,
        loading: false,
        error: 'Stripe publishable key is not configured'
      })
      return
    }

    loadStripe(publishableKey)
      .then((stripe) => {
        setState({
          stripe,
          loading: false,
          error: null
        })
      })
      .catch((error) => {
        const errorMessage = error.message.includes('Network') 
          ? 'Network error occurred while loading Stripe'
          : 'Failed to load Stripe'

        setState({
          stripe: null,
          loading: false,
          error: errorMessage
        })
      })
  }, [publishableKey])

  const retry = () => {
    setState({ stripe: null, loading: true, error: null })
    // Re-run the effect by changing publishableKey dependency
  }

  if (state.loading) {
    return (
      <div data-testid="stripe-loading" className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading payment system...</span>
      </div>
    )
  }

  if (state.error) {
    return (
      <div data-testid="stripe-error" className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Payment System Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{state.error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={retry}
                className="bg-red-100 text-red-800 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!state.stripe) {
    return (
      <div data-testid="stripe-error">
        <p>Stripe failed to initialize</p>
      </div>
    )
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  }

  return (
    <div data-testid="stripe-provider">
      <Elements stripe={state.stripe} options={{ appearance }}>
        {children}
      </Elements>
    </div>
  )
}