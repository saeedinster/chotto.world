/*
  # Fix Security Issues - Part 3: Fix Function Search Paths
  
  Sets explicit search_path for all SECURITY DEFINER functions
  to prevent search_path injection attacks.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    total_stories = total_stories + 1,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION cleanup_expired_matchmaking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.battle_matchmaking_queue
  WHERE expires_at < now()
  AND status = 'waiting';
END;
$$;

CREATE OR REPLACE FUNCTION get_or_create_daily_usage(p_user_id uuid)
RETURNS user_usage_tracking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage user_usage_tracking;
BEGIN
  SELECT * INTO v_usage
  FROM public.user_usage_tracking
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_usage_tracking (user_id, date)
    VALUES (p_user_id, CURRENT_DATE)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$;

CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_action_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated boolean := false;
BEGIN
  PERFORM get_or_create_daily_usage(p_user_id);
  
  IF p_action_type = 'game' THEN
    UPDATE public.user_usage_tracking
    SET games_played = games_played + 1, updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    v_updated := true;
  ELSIF p_action_type = 'story' THEN
    UPDATE public.user_usage_tracking
    SET stories_created = stories_created + 1, updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    v_updated := true;
  ELSIF p_action_type = 'battle' THEN
    UPDATE public.user_usage_tracking
    SET battles_played = battles_played + 1, updated_at = now()
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    v_updated := true;
  END IF;
  
  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION has_premium_access(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > now())
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$;

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_action_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage user_usage_tracking;
  v_is_premium boolean;
  v_current_count integer := 0;
  v_limit integer := 10;
  v_can_proceed boolean := false;
BEGIN
  v_is_premium := has_premium_access(p_user_id);
  
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'canProceed', true,
      'isPremium', true,
      'currentCount', 0,
      'limit', null,
      'remaining', null
    );
  END IF;
  
  v_usage := get_or_create_daily_usage(p_user_id);
  
  IF p_action_type = 'game' THEN
    v_current_count := v_usage.games_played;
  ELSIF p_action_type = 'story' THEN
    v_current_count := v_usage.stories_created;
  ELSIF p_action_type = 'battle' THEN
    v_current_count := v_usage.battles_played;
  END IF;
  
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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
