import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

interface StripeCheckoutProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StripeCheckout({ onSuccess, onCancel }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to subscribe');
        return;
      }

      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

      if (!stripeKey) {
        setError('Stripe is not configured. Please contact support.');
        console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            priceId: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_1234567890',
            successUrl: `${window.location.origin}?checkout=success`,
            cancelUrl: `${window.location.origin}?checkout=cancel`
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();

      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error('No session URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Setup Required</p>
            <p className="text-red-300 text-sm mt-1">{error}</p>
            <p className="text-red-300/70 text-xs mt-2">
              To enable payments, you need to configure Stripe. Follow the setup instructions.
            </p>
          </div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          'Continue to Checkout'
        )}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full mt-3 text-slate-400 hover:text-white transition-colors py-2"
        >
          Maybe later
        </button>
      )}
    </div>
  );
}
