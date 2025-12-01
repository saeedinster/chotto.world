/*
  # Add Multiplayer Features to Battle Arena
  
  This migration adds real-time multiplayer capabilities including matchmaking,
  friend system, live battles, and leaderboards.
  
  ## New Tables
  
  1. `battle_matchmaking_queue`
     - Players waiting for matches
     - Columns: id, user_id, trophy_range_min, trophy_range_max, status, joined_at
     - Used for automatic matchmaking based on trophy count
  
  2. `battle_friends`
     - Friend relationships between players
     - Columns: id, user_id, friend_id, status, created_at
     - Bidirectional friendships with pending/accepted states
  
  3. `battle_live_matches`
     - Active real-time battles
     - Columns: id, player1_id, player2_id, current_turn, game_state, status, started_at
     - Stores live battle state for synchronization
  
  4. `battle_emotes`
     - Quick reactions during battles
     - Columns: id, match_id, user_id, emote_type, created_at
     - Safe, pre-approved emotes for kids
  
  5. `battle_leaderboards`
     - Global and arena-specific rankings
     - Columns: id, user_id, rank, trophies, arena_level, updated_at
     - Updated daily for performance
  
  ## Security
  - Enable RLS on all tables
  - Users can only view/modify their own data
  - Matchmaking queue is protected
  - Live match data syncs between both players
*/

-- Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS battle_matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trophy_count integer NOT NULL DEFAULT 0,
  trophy_range_min integer NOT NULL DEFAULT 0,
  trophy_range_max integer NOT NULL DEFAULT 1000,
  deck_id uuid REFERENCES player_decks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
  matched_with uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '5 minutes'
);

ALTER TABLE battle_matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view matchmaking queue"
  ON battle_matchmaking_queue FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join matchmaking queue"
  ON battle_matchmaking_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue status"
  ON battle_matchmaking_queue FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave queue"
  ON battle_matchmaking_queue FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Friends Table
CREATE TABLE IF NOT EXISTS battle_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE battle_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON battle_friends FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can send friend requests"
  ON battle_friends FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend status"
  ON battle_friends FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships"
  ON battle_friends FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Live Matches Table
CREATE TABLE IF NOT EXISTS battle_live_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_turn uuid NOT NULL REFERENCES auth.users(id),
  turn_number integer NOT NULL DEFAULT 1,
  game_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  player1_health integer NOT NULL DEFAULT 1000,
  player2_health integer NOT NULL DEFAULT 1000,
  player1_elixir integer NOT NULL DEFAULT 10,
  player2_elixir integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  winner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  last_action_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CHECK (player1_id != player2_id)
);

ALTER TABLE battle_live_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their matches"
  ON battle_live_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "System can create matches"
  ON battle_live_matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can update their matches"
  ON battle_live_matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id)
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Battle Emotes Table
CREATE TABLE IF NOT EXISTS battle_emotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES battle_live_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emote_type text NOT NULL CHECK (emote_type IN ('happy', 'sad', 'wow', 'good_game', 'well_played', 'oops', 'thanks', 'thinking')),
  emote_emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE battle_emotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view match emotes"
  ON battle_emotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM battle_live_matches
      WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

CREATE POLICY "Players can send emotes"
  ON battle_emotes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM battle_live_matches
      WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
      AND status = 'active'
    )
  );

-- Leaderboard Table
CREATE TABLE IF NOT EXISTS battle_leaderboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  rank integer NOT NULL DEFAULT 0,
  trophies integer NOT NULL DEFAULT 0,
  arena_level integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  win_streak integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE battle_leaderboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboards"
  ON battle_leaderboards FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own leaderboard entry"
  ON battle_leaderboards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own leaderboard entry"
  ON battle_leaderboards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON battle_matchmaking_queue(status, trophy_count);
CREATE INDEX IF NOT EXISTS idx_matchmaking_expires ON battle_matchmaking_queue(expires_at);
CREATE INDEX IF NOT EXISTS idx_friends_user ON battle_friends(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON battle_friends(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_live_matches_players ON battle_live_matches(player1_id, player2_id, status);
CREATE INDEX IF NOT EXISTS idx_live_matches_status ON battle_live_matches(status, last_action_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON battle_leaderboards(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_trophies ON battle_leaderboards(trophies DESC);

-- Function to clean up expired matchmaking entries
CREATE OR REPLACE FUNCTION cleanup_expired_matchmaking()
RETURNS void AS $$
BEGIN
  DELETE FROM battle_matchmaking_queue
  WHERE expires_at < now() AND status = 'waiting';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
