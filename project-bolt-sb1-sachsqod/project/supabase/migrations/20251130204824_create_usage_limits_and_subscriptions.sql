/*
  # Usage Limits & Subscription System
  
  Creates a comprehensive freemium model with usage tracking and subscription management.
  
  ## New Tables
  
  1. `user_usage_tracking`
     - Tracks daily usage for games, story creation, and battles
     - Resets daily at midnight UTC
     - Indexed for fast lookups
  
  2. `subscriptions`
     - Stores Stripe subscription data
     - Tracks subscription status and billing
     - Links to Stripe customer and subscription IDs
  
  ## Limits (Free Tier)
  - Games: 10 plays per day
  - Story Creation: 10 stories per day
  - Battle Games: 10 battles per day
  
  ## Premium Tier ($4.99/month)
  - Unlimited games
  - Unlimited story creation
  - Unlimited battles
  - Premium features unlocked
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Automatic usage reset via triggers
*/

-- Create user_usage_tracking table
CREATE TABLE IF NOT EXISTS user_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  games_played integer DEFAULT 0 NOT NULL,
  stories_created integer DEFAULT 0 NOT NULL,
  battles_played integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, date)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON user_usage_tracking(user_id, date);

-- Enable RLS
ALTER TABLE user_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_usage_tracking
CREATE POLICY "Users can view own usage"
  ON user_usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON user_usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON user_usage_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'inactive')),
  plan_name text DEFAULT 'premium',
  plan_amount integer DEFAULT 499,
  currency text DEFAULT 'usd',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to get or create usage tracking for today
CREATE OR REPLACE FUNCTION get_or_create_daily_usage(p_user_id uuid)
RETURNS user_usage_tracking
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage user_usage_tracking;
BEGIN
  -- Try to get today's usage
  SELECT * INTO v_usage
  FROM user_usage_tracking
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- If not exists, create it
  IF NOT FOUND THEN
    INSERT INTO user_usage_tracking (user_id, date)
    VALUES (p_user_id, CURRENT_DATE)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_action_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  -- Get or create today's usage record
  PERFORM get_or_create_daily_usage(p_user_id);
  
  -- Increment the appropriate counter
  IF p_action_type = 'game' THEN
    UPDATE user_usage_tracking
    SET games_played = games_played + 1, updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    v_updated := true;
  ELSIF p_action_type = 'story' THEN
    UPDATE user_usage_tracking
    SET stories_created = stories_created + 1, updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    v_updated := true;
  ELSIF p_action_type = 'battle' THEN
    UPDATE user_usage_tracking
    SET battles_played = battles_played + 1, updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    v_updated := true;
  END IF;
  
  RETURN v_updated;
END;
$$;

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION has_premium_access(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_access boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > now())
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_action_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usage user_usage_tracking;
  v_is_premium boolean;
  v_current_count integer := 0;
  v_limit integer := 10;
  v_can_proceed boolean := false;
BEGIN
  -- Check if user has premium
  v_is_premium := has_premium_access(p_user_id);
  
  -- Premium users have unlimited access
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'canProceed', true,
      'isPremium', true,
      'currentCount', 0,
      'limit', null,
      'remaining', null
    );
  END IF;
  
  -- Get today's usage
  v_usage := get_or_create_daily_usage(p_user_id);
  
  -- Check the appropriate counter
  IF p_action_type = 'game' THEN
    v_current_count := v_usage.games_played;
  ELSIF p_action_type = 'story' THEN
    v_current_count := v_usage.stories_created;
  ELSIF p_action_type = 'battle' THEN
    v_current_count := v_usage.battles_played;
  END IF;
  
  -- Check if under limit
  v_can_proceed := v_current_count < v_limit;
  
  RETURN jsonb_build_object(
    'canProceed', v_can_proceed,
    'isPremium', false,
    'currentCount', v_current_count,
    'limit', v_limit,
    'remaining', GREATEST(0, v_limit - v_current_count)
  );
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_usage_tracking_updated_at
  BEFORE UPDATE ON user_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
