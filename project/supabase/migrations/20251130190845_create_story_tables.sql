/*
  # Create Story Builder Database Schema

  1. New Tables
    - `stories`
      - `id` (uuid, primary key) - unique story identifier
      - `title` (text) - story title
      - `raw_transcript` (text) - original voice recording transcript
      - `enhanced_story` (text) - AI-enhanced story content
      - `author_name` (text) - child's name
      - `author_image_url` (text, nullable) - optional author photo
      - `theme` (text) - story theme/genre
      - `color_scheme` (jsonb) - color palette for the story
      - `created_at` (timestamptz) - creation timestamp
      - `updated_at` (timestamptz) - last update timestamp
    
    - `story_characters`
      - `id` (uuid, primary key) - unique character identifier
      - `story_id` (uuid, foreign key) - references stories table
      - `name` (text) - character name
      - `description` (text) - character description
      - `appearance` (jsonb) - visual characteristics
      - `role` (text) - main/supporting character
      - `position` (integer) - order in story
      - `created_at` (timestamptz) - creation timestamp
    
    - `story_pages`
      - `id` (uuid, primary key) - unique page identifier
      - `story_id` (uuid, foreign key) - references stories table
      - `page_number` (integer) - page sequence
      - `content` (text) - page text content
      - `scene_description` (text) - visual scene description
      - `animation_style` (text) - animation type for page
      - `background_color` (text) - page background color
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - Enable RLS on all tables
    - Public access for reading (children's app, no auth required)
    - Public access for creating stories
    - Stories can be updated by anyone (collaborative/demo mode)

  3. Indexes
    - Index on story_id for faster character and page lookups
    - Index on created_at for chronological sorting
*/

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'My Amazing Story',
  raw_transcript text,
  enhanced_story text,
  author_name text NOT NULL DEFAULT 'Young Author',
  author_image_url text,
  theme text DEFAULT 'adventure',
  color_scheme jsonb DEFAULT '{"primary": "#FF6B6B", "secondary": "#4ECDC4", "accent": "#FFE66D"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create story_characters table
CREATE TABLE IF NOT EXISTS story_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  appearance jsonb DEFAULT '{}'::jsonb,
  role text DEFAULT 'supporting',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create story_pages table
CREATE TABLE IF NOT EXISTS story_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid REFERENCES stories(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  content text NOT NULL,
  scene_description text DEFAULT '',
  animation_style text DEFAULT 'fade',
  background_color text DEFAULT '#FFE66D',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_story_characters_story_id ON story_characters(story_id);
CREATE INDEX IF NOT EXISTS idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (children's app without authentication)
CREATE POLICY "Anyone can view stories"
  ON stories FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create stories"
  ON stories FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update stories"
  ON stories FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete stories"
  ON stories FOR DELETE
  TO anon
  USING (true);

-- Policies for story_characters
CREATE POLICY "Anyone can view characters"
  ON story_characters FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create characters"
  ON story_characters FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update characters"
  ON story_characters FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete characters"
  ON story_characters FOR DELETE
  TO anon
  USING (true);

-- Policies for story_pages
CREATE POLICY "Anyone can view pages"
  ON story_pages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can create pages"
  ON story_pages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update pages"
  ON story_pages FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete pages"
  ON story_pages FOR DELETE
  TO anon
  USING (true);