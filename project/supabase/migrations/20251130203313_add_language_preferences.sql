/*
  # Add Language Preferences
  
  Adds support for storing user language preferences for multi-language accessibility.
  
  ## Changes
  
  1. Update user_profiles table
     - Add language column to store user's preferred language
     - Default to 'en' (English)
  
  ## Supported Languages
  - en: English
  - es: Spanish (Español)
  - fr: French (Français)
  - de: German (Deutsch)
  - pt: Portuguese (Português)
  - zh: Chinese (中文)
  - ja: Japanese (日本語)
  - ar: Arabic (العربية)
  - hi: Hindi (हिन्दी)
  - ru: Russian (Русский)
  
  ## Security
  - Users can update their own language preference
*/

-- Add language column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN language text NOT NULL DEFAULT 'en' 
      CHECK (language IN ('en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi', 'ru'));
  END IF;
END $$;

-- Create index for faster language queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_language ON user_profiles(language);
