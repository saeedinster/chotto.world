/*
  # Add Gamification and Progress Tracking System

  1. New Tables
    - `reading_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `story_id` (uuid, references premade_stories)
      - `completed` (boolean) - Story finished or not
      - `read_count` (integer) - Times user read this story
      - `last_read_at` (timestamptz) - Last time story was read
      - `favorited` (boolean) - Is this a favorite story
      - `created_at` (timestamptz)
      
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `achievement_type` (text) - Type: first_story, speed_reader, story_master, etc.
      - `earned_at` (timestamptz) - When achievement was earned
      - `metadata` (jsonb) - Additional achievement data
      
    - `reading_streaks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `current_streak` (integer) - Current consecutive days
      - `longest_streak` (integer) - Best streak ever
      - `last_read_date` (date) - Last day user read
      - `total_stories_read` (integer) - Total count
      - `updated_at` (timestamptz)
      
    - `quiz_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `story_id` (uuid, references premade_stories)
      - `score` (integer) - Score out of 100
      - `questions_correct` (integer) - Number correct
      - `total_questions` (integer) - Total questions
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Users can only access their own progress data
    - Proper policies for read, insert, and update operations

  3. Indexes
    - Add indexes for faster queries on user_id and story_id
*/

-- Reading Progress Table
CREATE TABLE IF NOT EXISTS reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_id uuid REFERENCES premade_stories(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  read_count integer DEFAULT 1 NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  favorited boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, story_id)
);

ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading progress"
  ON reading_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress"
  ON reading_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress"
  ON reading_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_story_id ON reading_progress(story_id);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_type text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON user_achievements(user_id);

-- Reading Streaks Table
CREATE TABLE IF NOT EXISTS reading_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer DEFAULT 0 NOT NULL,
  longest_streak integer DEFAULT 0 NOT NULL,
  last_read_date date,
  total_stories_read integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading streaks"
  ON reading_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading streaks"
  ON reading_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading streaks"
  ON reading_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_id uuid REFERENCES premade_stories(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL,
  questions_correct integer NOT NULL,
  total_questions integer NOT NULL,
  completed_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON quiz_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_story_id ON quiz_results(story_id);