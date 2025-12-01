import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Story {
  id: string;
  title: string;
  raw_transcript: string | null;
  enhanced_story: string | null;
  author_name: string;
  author_image_url: string | null;
  theme: string;
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  created_at: string;
  updated_at: string;
}

export interface StoryCharacter {
  id: string;
  story_id: string;
  name: string;
  description: string;
  appearance: Record<string, unknown>;
  role: string;
  position: number;
  created_at: string;
}

export interface StoryPage {
  id: string;
  story_id: string;
  page_number: number;
  content: string;
  scene_description: string;
  animation_style: string;
  background_color: string;
  created_at: string;
}
