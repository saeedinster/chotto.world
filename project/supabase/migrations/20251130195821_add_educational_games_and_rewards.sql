/*
  # Add Educational Games and Rewards System

  1. New Tables
    - `learning_games`
      - `id` (uuid, primary key)
      - `name` (text) - Game name
      - `type` (text) - memory, matching, counting, spelling, etc.
      - `difficulty` (text) - easy, medium, hard
      - `age_range` (text) - Target age
      - `description` (text) - Game description
      - `config` (jsonb) - Game configuration
      - `created_at` (timestamptz)
      
    - `game_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `game_id` (uuid, references learning_games)
      - `score` (integer) - Score achieved
      - `time_taken_seconds` (integer) - Time to complete
      - `completed` (boolean) - Game finished
      - `played_at` (timestamptz)
      
    - `user_vocabulary`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `word` (text) - Vocabulary word
      - `definition` (text) - Word meaning
      - `story_id` (uuid, references premade_stories) - Source story
      - `mastered` (boolean) - Word mastered
      - `practice_count` (integer) - Times practiced
      - `created_at` (timestamptz)
      
    - `virtual_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `reward_type` (text) - sticker, badge, trophy, star
      - `reward_name` (text) - Reward name
      - `reward_emoji` (text) - Visual representation
      - `earned_at` (timestamptz)
      - `source` (text) - How earned (story, quiz, game, streak)
      
    - `user_avatars`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) UNIQUE
      - `avatar_data` (jsonb) - Avatar customization
      - `level` (integer) - User level
      - `experience_points` (integer) - XP earned
      - `updated_at` (timestamptz)
      
    - `daily_challenges`
      - `id` (uuid, primary key)
      - `challenge_type` (text) - read_story, play_game, quiz
      - `challenge_description` (text) - Challenge details
      - `target_value` (integer) - Goal to achieve
      - `reward_xp` (integer) - XP reward
      - `active_date` (date) - Challenge date
      - `created_at` (timestamptz)
      
    - `user_challenge_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `challenge_id` (uuid, references daily_challenges)
      - `current_progress` (integer) - Current value
      - `completed` (boolean) - Challenge done
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Public can read game definitions

  3. Indexes
    - Add indexes for user_id and game_id lookups
*/

-- Learning Games Table
CREATE TABLE IF NOT EXISTS learning_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  difficulty text DEFAULT 'easy' NOT NULL,
  age_range text NOT NULL,
  description text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE learning_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view learning games"
  ON learning_games FOR SELECT
  TO public
  USING (true);

-- Game Scores Table
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id uuid REFERENCES learning_games(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 NOT NULL,
  time_taken_seconds integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  played_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own game scores"
  ON game_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game scores"
  ON game_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON game_scores(game_id);

-- User Vocabulary Table
CREATE TABLE IF NOT EXISTS user_vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word text NOT NULL,
  definition text NOT NULL,
  story_id uuid REFERENCES premade_stories(id) ON DELETE SET NULL,
  mastered boolean DEFAULT false NOT NULL,
  practice_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, word)
);

ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vocabulary"
  ON user_vocabulary FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary"
  ON user_vocabulary FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary"
  ON user_vocabulary FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON user_vocabulary(user_id);

-- Virtual Rewards Table
CREATE TABLE IF NOT EXISTS virtual_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_type text NOT NULL,
  reward_name text NOT NULL,
  reward_emoji text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  source text NOT NULL
);

ALTER TABLE virtual_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON virtual_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON virtual_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON virtual_rewards(user_id);

-- User Avatars Table
CREATE TABLE IF NOT EXISTS user_avatars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  avatar_data jsonb DEFAULT '{"skin":"😊","hair":"🦱","outfit":"👕","accessory":"🎒"}'::jsonb NOT NULL,
  level integer DEFAULT 1 NOT NULL,
  experience_points integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar"
  ON user_avatars FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar"
  ON user_avatars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar"
  ON user_avatars FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily Challenges Table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_type text NOT NULL,
  challenge_description text NOT NULL,
  target_value integer DEFAULT 1 NOT NULL,
  reward_xp integer DEFAULT 100 NOT NULL,
  active_date date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily challenges"
  ON daily_challenges FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_challenges_date ON daily_challenges(active_date);

-- User Challenge Progress Table
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  current_progress integer DEFAULT 0 NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge progress"
  ON user_challenge_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress"
  ON user_challenge_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress"
  ON user_challenge_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON user_challenge_progress(user_id);

-- Insert sample learning games
INSERT INTO learning_games (name, type, difficulty, age_range, description, config) VALUES
('Memory Match', 'memory', 'easy', '3-6', 'Match pairs of story characters and objects', '{"pairs": 6, "timeLimit": 60}'),
('Word Builder', 'spelling', 'medium', '5-6', 'Spell words from the stories you read', '{"wordCount": 5, "hints": true}'),
('Count the Stars', 'counting', 'easy', '1-3', 'Count stars and learn numbers 1-10', '{"maxNumber": 10, "items": "stars"}'),
('Shape Sorter', 'matching', 'easy', '2-4', 'Match shapes and colors', '{"shapes": ["circle", "square", "triangle"], "colors": 4}'),
('Story Sequencer', 'logic', 'medium', '4-6', 'Put story events in the right order', '{"events": 5, "hints": 2}'),
('Rhyme Time', 'phonics', 'medium', '4-6', 'Find words that rhyme', '{"wordPairs": 6, "timeLimit": 90}'),
('Color Mixer', 'creative', 'easy', '2-5', 'Mix colors and learn combinations', '{"primaryColors": true, "mixing": true}'),
('Number Detective', 'counting', 'medium', '4-6', 'Find hidden numbers and solve puzzles', '{"range": [1, 20], "puzzles": 5}');

-- Insert today's daily challenges
INSERT INTO daily_challenges (challenge_type, challenge_description, target_value, reward_xp, active_date) VALUES
('read_story', 'Read 2 stories today', 2, 150, CURRENT_DATE),
('play_game', 'Play 3 learning games', 3, 100, CURRENT_DATE),
('quiz', 'Complete a quiz with 80% or higher', 1, 200, CURRENT_DATE),
('streak', 'Continue your reading streak', 1, 50, CURRENT_DATE);