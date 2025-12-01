import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UsageLimit {
  canProceed: boolean;
  isPremium: boolean;
  currentCount: number;
  limit: number | null;
  remaining: number | null;
}

export type ActionType = 'game' | 'story' | 'battle';

export function useUsageLimit(actionType: ActionType) {
  const [usageLimit, setUsageLimit] = useState<UsageLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkLimit = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase
        .rpc('check_usage_limit', {
          p_user_id: user.id,
          p_action_type: actionType
        });

      if (rpcError) {
        console.error('Error checking usage limit:', rpcError);
        setError(rpcError.message);
      } else {
        setUsageLimit(data as UsageLimit);
      }
    } catch (err) {
      console.error('Error in checkLimit:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const { data, error: rpcError } = await supabase
        .rpc('increment_usage', {
          p_user_id: user.id,
          p_action_type: actionType
        });

      if (rpcError) {
        console.error('Error incrementing usage:', rpcError);
        return false;
      }

      await checkLimit();
      return data as boolean;
    } catch (err) {
      console.error('Error in incrementUsage:', err);
      return false;
    }
  };

  const checkPremiumStatus = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const { data, error: rpcError } = await supabase
        .rpc('has_premium_access', {
          p_user_id: user.id
        });

      if (rpcError) {
        console.error('Error checking premium status:', rpcError);
        return false;
      }

      return data as boolean;
    } catch (err) {
      console.error('Error in checkPremiumStatus:', err);
      return false;
    }
  };

  useEffect(() => {
    checkLimit();
  }, [actionType]);

  return {
    usageLimit,
    loading,
    error,
    checkLimit,
    incrementUsage,
    checkPremiumStatus
  };
}
