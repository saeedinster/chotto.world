/*
  # Story Battle Arena - Card Battle Game System
  
  A kid-friendly card battle game similar to Clash Royale with educational elements.
  
  ## New Tables
  
  1. `battle_cards`
     - Card definitions with stats, type, rarity
     - Columns: id, name, emoji, card_type, rarity, cost, health, attack, special_ability, description
     - Used to define all available cards in the game
  
  2. `player_cards`
     - User's card collection with levels
     - Columns: id, user_id, card_id, level, quantity, unlocked_at
     - Tracks which cards each player owns and their upgrade levels
  
  3. `player_decks`
     - User's card deck configurations (8 cards per deck)
     - Columns: id, user_id, deck_name, card_slots (jsonb array)
     - Players can have multiple decks
  
  4. `battle_matches`
     - Battle history and results
     - Columns: id, player_id, opponent_type, result, trophies_gained, duration_seconds, played_at
     - Tracks all battles for statistics
  
  5. `player_battle_stats`
     - Overall player statistics
     - Columns: id, user_id, trophies, arena_level, total_wins, total_losses, win_streak, highest_trophies
     - Tracks progression and achievements
  
  ## Security
  - Enable RLS on all tables
  - Users can only view/modify their own data
  - battle_cards is public read-only (game definitions)
*/

-- Battle Cards Table (game card definitions)
CREATE TABLE IF NOT EXISTS battle_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  emoji text NOT NULL,
  card_type text NOT NULL CHECK (card_type IN ('character', 'spell', 'building')),
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  cost integer NOT NULL DEFAULT 3 CHECK (cost >= 1 AND cost <= 10),
  health integer NOT NULL DEFAULT 100,
  attack integer NOT NULL DEFAULT 10,
  special_ability text,
  description text NOT NULL,
  unlock_arena integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE battle_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view battle cards"
  ON battle_cards FOR SELECT
  TO authenticated, anon
  USING (true);

-- Player Cards Table (user's card collection)
CREATE TABLE IF NOT EXISTS player_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES battle_cards(id) ON DELETE CASCADE,
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 13),
  quantity integer NOT NULL DEFAULT 1,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, card_id)
);

ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON player_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON player_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON player_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Player Decks Table
CREATE TABLE IF NOT EXISTS player_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_name text NOT NULL DEFAULT 'My Deck',
  card_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE player_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decks"
  ON player_decks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON player_decks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own decks"
  ON player_decks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own decks"
  ON player_decks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Battle Matches Table
CREATE TABLE IF NOT EXISTS battle_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_type text NOT NULL DEFAULT 'ai' CHECK (opponent_type IN ('ai', 'player')),
  opponent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  result text NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  trophies_gained integer NOT NULL DEFAULT 0,
  trophies_lost integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  cards_played jsonb DEFAULT '[]'::jsonb,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE battle_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON battle_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own matches"
  ON battle_matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Player Battle Stats Table
CREATE TABLE IF NOT EXISTS player_battle_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trophies integer NOT NULL DEFAULT 0,
  arena_level integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  total_losses integer NOT NULL DEFAULT 0,
  total_draws integer NOT NULL DEFAULT 0,
  win_streak integer NOT NULL DEFAULT 0,
  best_win_streak integer NOT NULL DEFAULT 0,
  highest_trophies integer NOT NULL DEFAULT 0,
  total_cards_unlocked integer NOT NULL DEFAULT 0,
  favorite_card_id uuid REFERENCES battle_cards(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE player_battle_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own battle stats"
  ON player_battle_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own battle stats"
  ON player_battle_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own battle stats"
  ON player_battle_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert starter battle cards for the game
INSERT INTO battle_cards (name, emoji, card_type, rarity, cost, health, attack, special_ability, description, unlock_arena) VALUES
  -- Common Cards (Arena 0 - Starter)
  ('Baby Dragon', '🐲', 'character', 'common', 4, 150, 25, 'Flies over obstacles', 'A cute baby dragon that flies and breathes fire!', 0),
  ('Knight', '🛡️', 'character', 'common', 3, 200, 20, 'Strong defense', 'A brave knight with a shield and sword!', 0),
  ('Archer', '🏹', 'character', 'common', 3, 80, 15, 'Attacks from distance', 'Shoots arrows from far away!', 0),
  ('Slime', '💧', 'character', 'common', 2, 60, 10, 'Splits into two', 'A bouncy slime that multiplies!', 0),
  
  -- Rare Cards (Arena 1)
  ('Wizard', '🧙', 'character', 'rare', 5, 120, 35, 'Area damage spell', 'Casts magical spells that hit multiple enemies!', 1),
  ('Giant', '🗿', 'character', 'rare', 6, 400, 30, 'High health tank', 'A huge giant that absorbs damage!', 1),
  ('Fairy', '🧚', 'character', 'rare', 4, 90, 20, 'Heals nearby allies', 'A magical fairy that heals friends!', 1),
  
  -- Epic Cards (Arena 2)
  ('Phoenix', '🔥', 'character', 'epic', 7, 250, 45, 'Revives once when defeated', 'A legendary bird that comes back to life!', 2),
  ('Ice Golem', '❄️', 'character', 'epic', 5, 300, 15, 'Freezes enemies on death', 'Freezes enemies when defeated!', 2),
  
  -- Legendary Cards (Arena 3)
  ('Rainbow Unicorn', '🦄', 'character', 'legendary', 8, 350, 50, 'Shoots rainbow beams', 'The most magical creature in the arena!', 3),
  
  -- Spell Cards
  ('Lightning Bolt', '⚡', 'spell', 'common', 3, 0, 80, 'Instant damage to one target', 'Strike with lightning power!', 0),
  ('Healing Wave', '💚', 'spell', 'rare', 4, 0, 0, 'Heals all friendly units', 'Restore health to your team!', 1),
  ('Meteor Storm', '☄️', 'spell', 'epic', 6, 0, 120, 'Damages all enemy units', 'Rain down meteors on enemies!', 2),
  
  -- Building Cards
  ('Magic Tower', '🗼', 'building', 'rare', 5, 250, 20, 'Shoots at enemies', 'A tower that defends your side!', 1),
  ('Star Shield', '⭐', 'building', 'epic', 4, 200, 0, 'Protects nearby units', 'Creates a protective barrier!', 2)
ON CONFLICT DO NOTHING;
