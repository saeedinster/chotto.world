/*
  # Add User Authentication and Subscription System

  1. Changes to Existing Tables
    - `stories` table
      - Add `user_id` column to link stories to authenticated users
      - Update RLS policies to restrict access based on user ownership

  2. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users, primary key)
      - `email` (text)
      - `display_name` (text)
      - `avatar_url` (text, nullable)
      - `story_count` (integer) - tracks number of stories created
      - `total_recording_time` (integer) - tracks total recording time in seconds
      - `subscription_status` (text) - free, active, cancelled
      - `subscription_id` (text, nullable) - Stripe subscription ID
      - `subscription_end_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Users can only read/write their own data
    - Public cannot access any data without authentication
*/

-- Add user_id to stories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE stories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  story_count integer DEFAULT 0 NOT NULL,
  total_recording_time integer DEFAULT 0 NOT NULL,
  subscription_status text DEFAULT 'free' NOT NULL,
  subscription_id text,
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update RLS policies for stories table
DROP POLICY IF EXISTS "Enable read access for all users" ON stories;
DROP POLICY IF EXISTS "Enable insert for all users" ON stories;

CREATE POLICY "Users can view own stories"
  ON stories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for story_characters (inherit from stories)
CREATE POLICY "Users can view own story characters"
  ON story_characters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_characters.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own story characters"
  ON story_characters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_characters.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- RLS Policies for story_pages (inherit from stories)
CREATE POLICY "Users can view own story pages"
  ON story_pages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_pages.story_id
      AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own story pages"
  ON story_pages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_pages.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update user stats after story creation
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET 
    story_count = story_count + 1,
    updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats on story insert
DROP TRIGGER IF EXISTS on_story_created ON stories;
CREATE TRIGGER on_story_created
  AFTER INSERT ON stories
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();