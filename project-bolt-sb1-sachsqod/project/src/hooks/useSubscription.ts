import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive';
  plan_name: string;
  plan_amount: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        setError(fetchError.message);
      } else {
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const isPremium = (): boolean => {
    if (!subscription) return false;

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    if (!isActive) return false;

    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      return endDate > new Date();
    }

    return isActive;
  };

  const isExpiringSoon = (): boolean => {
    if (!subscription || !subscription.current_period_end) return false;

    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  useEffect(() => {
    fetchSubscription();

    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions'
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    subscription,
    loading,
    error,
    isPremium: isPremium(),
    isExpiringSoon: isExpiringSoon(),
    refetch: fetchSubscription
  };
}
